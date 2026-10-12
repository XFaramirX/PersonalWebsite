'use client';

import { useEffect, useRef, useState } from 'react';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
// Set both in .env.local to start real runs through the proxy.
const runApi = process.env.NEXT_PUBLIC_RUN_API;
const dataBase = process.env.NEXT_PUBLIC_QA_DATA_URL ?? `${base}/qa`;

type PwTest = {
  projectName: string;
  results: { status: string; duration: number }[];
};
type PwSuite = {
  title: string;
  specs?: { title: string; tests: PwTest[] }[];
  suites?: PwSuite[];
};
type PwReport = { suites: PwSuite[]; stats?: { duration?: number } };
type Run = {
  number: string;
  branch: string;
  commit: string;
  publishedAt: string;
  url: string;
  workflowUrl: string;
};
type HistoryEntry = {
  number: string;
  passed: number;
  failed: number;
  duration: number;
  commit?: string;
  publishedAt?: string;
  url?: string;
  tests?: Row[];
};
type Row = {
  suite: string;
  title: string;
  project: string;
  ok: boolean;
  ms: number;
};
type Filter = { suite: string; project: string } | null;
type Line = { text: string; tone: 'head' | 'ok' | 'fail' | 'muted' };

function stepLines(heading: string, tests?: Row[]): Line[] {
  if (!tests) {
    return [
      { text: heading, tone: 'head' },
      { text: 'Steps were not recorded for this run.', tone: 'muted' },
    ];
  }
  return [
    { text: heading, tone: 'head' },
    ...tests.map(
      (r): Line => ({
        text: `${r.ok ? '✓' : '✗'} [${r.project}] ${r.title} (${(r.ms / 1000).toFixed(1)}s)`,
        tone: r.ok ? 'ok' : 'fail',
      }),
    ),
  ];
}

function flatten(suite: PwSuite, group: string, rows: Row[]) {
  const name = /\.spec\.[tj]s$/.test(suite.title)
    ? group
    : suite.title || group;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      rows.push({
        suite: name,
        title: spec.title,
        project: t.projectName,
        ok: t.results.at(-1)?.status === 'passed',
        ms: t.results.reduce((s, r) => s + r.duration, 0),
      });
    }
  }
  for (const child of suite.suites ?? []) flatten(child, name, rows);
}

// Pages caches for 10 minutes; revalidate so a reload never shows an older run.
const getJson = (path: string) =>
  fetch(`${dataBase}/${path}`, { cache: 'no-cache' }).then((r) =>
    r.ok ? r.json() : Promise.reject(),
  );

export function QaDashboard() {
  const [data, setData] = useState<{ run: Run; report: PwReport } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [replayed, setReplayed] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, []);

  function load() {
    Promise.all([getJson('run.json'), getJson('results.json')])
      .then(([run, report]) => alive.current && setData({ run, report }))
      .catch(() => setData(null));
    getJson('history.json')
      .then((h) => alive.current && setHistory(h))
      .catch(() => setHistory([]));
  }

  const rows: Row[] = [];
  data?.report.suites.forEach((s) => flatten(s, s.title, rows));
  const passed = rows.filter((r) => r.ok).length;
  const suites = [...new Set(rows.map((r) => r.suite))];
  const wall = Math.round((data?.report.stats?.duration ?? 0) / 1000);
  const label = filter
    ? `${filter.suite} on ${filter.project}`
    : 'the QA suites';

  function toggle(suite: string, project: string) {
    if (running) return;
    setFilter((f) =>
      f?.suite === suite && f.project === project ? null : { suite, project },
    );
  }

  async function liveRun() {
    const pause = (ms: number) => new Promise((res) => setTimeout(res, ms));
    const push = (line: Line) => alive.current && setLines((l) => [...l, line]);
    setRunning(true);
    setLines([]);
    try {
      const start = await fetch(`${runApi}/run`, { method: 'POST' });
      if (start.status === 429) {
        const { retryAfterMs } = await start.json();
        push({
          text: `A run was started recently. Try again in ${Math.ceil(retryAfterMs / 60000)} min.`,
          tone: 'fail',
        });
        return;
      }
      if (!start.ok) throw new Error('start failed');
      const { startedAt } = await start.json();
      push({ text: '> Workflow dispatched on GitHub Actions', tone: 'head' });

      const seen = new Map<string, string>();
      for (let i = 0; i < 180 && alive.current; i++) {
        await pause(5000);
        const s = await (
          await fetch(`${runApi}/status?since=${encodeURIComponent(startedAt)}`)
        ).json();
        for (const job of s.jobs ?? []) {
          const state =
            job.status === 'completed' ? job.conclusion : job.status;
          if (state === 'queued' || seen.get(job.name) === state) continue;
          seen.set(job.name, state);
          if (job.status === 'completed') {
            const ok = job.conclusion === 'success';
            push({
              text: `${ok ? '✓' : '✗'} ${job.name} (${job.conclusion})`,
              tone: ok ? 'ok' : 'fail',
            });
          } else {
            push({ text: `… ${job.name} running`, tone: 'muted' });
          }
        }
        if (s.status === 'completed') {
          push({
            text: `Run finished: ${s.conclusion}`,
            tone: s.conclusion === 'success' ? 'ok' : 'fail',
          });
          load();
          setReplayed(true);
          return;
        }
      }
      push({
        text: 'Still running. Check the CI run for progress.',
        tone: 'muted',
      });
    } catch {
      push({ text: 'Could not reach the run service.', tone: 'fail' });
    } finally {
      setRunning(false);
    }
  }

  async function replay() {
    if (running) return;
    if (runApi) return liveRun();
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const sleep = (ms: number) =>
      new Promise((res) => setTimeout(res, reduce ? 0 : ms));
    const picked = rows.filter(
      (r) =>
        !filter || (r.suite === filter.suite && r.project === filter.project),
    );
    const projects = [...new Set(picked.map((r) => r.project))];

    setRunning(true);
    setLines([]);
    const push = (line: Line) => setLines((l) => [...l, line]);
    for (const project of projects) {
      if (!alive.current) return;
      push({
        text: `> pnpm exec playwright test --project=${project}`,
        tone: 'head',
      });
      await sleep(400);
      for (const r of picked.filter((x) => x.project === project)) {
        if (!alive.current) return;
        push({
          text: `${r.ok ? '✓' : '✗'} ${r.title} (${(r.ms / 1000).toFixed(1)}s)`,
          tone: r.ok ? 'ok' : 'fail',
        });
        await sleep(90);
      }
    }
    const ok = picked.filter((r) => r.ok).length;
    push({
      text: `${ok} of ${picked.length} passed (${wall}s wall time)`,
      tone: 'head',
    });
    setRunning(false);
    setReplayed(true);
  }

  const widest = Math.max(1, ...history.map((h) => h.duration));
  const past = history.find((h) => h.number === viewing);
  // Live output wins, then a chosen past run, then the latest published run.
  const shown: Line[] = lines.length
    ? lines
    : past
      ? stepLines(
          `> CI #${past.number}${past.commit ? ` · ${past.commit}` : ''}`,
          past.tests,
        )
      : data
        ? stepLines(`> CI #${data.run.number} · ${data.run.commit}`, rows)
        : [];

  function view(number: string) {
    if (running) return;
    setLines([]);
    setViewing(number);
  }

  return (
    <section className="qa-section section-block" id="qa">
      <div className="section-label">
        <span>03</span>
        <span>LIVE CI RESULTS</span>
      </div>
      {!data ? (
        <p className="qa-empty">
          Waiting for a published run. Results appear after the CI workflow
          completes on main.
        </p>
      ) : (
        <>
          <div className="qa-run">
            <span>
              RUN <b>CI #{data.run.number}</b>
            </span>
            <span>
              BRANCH <b>{data.run.branch}</b>
            </span>
            <span>
              COMMIT <b>{data.run.commit}</b>
            </span>
            <span>
              PUBLISHED <b>{data.run.publishedAt.slice(0, 10)}</b>
            </span>
            <a href={data.run.url} target="_blank" rel="noreferrer">
              Open the CI run ↗
            </a>
          </div>
          <div className="qa-stats">
            <div>
              <strong>{rows.length}</strong> RESULTS
            </div>
            <div>
              <strong>
                {new Set(rows.map((r) => `${r.suite}/${r.title}`)).size}
              </strong>{' '}
              DISTINCT CASES
            </div>
            <div>
              <strong>
                {rows.length ? Math.round((passed / rows.length) * 100) : 0}%
              </strong>{' '}
              PASSING
            </div>
            <div>
              <strong>{wall}s</strong> WALL TIME
            </div>
          </div>
          <div className="qa-body">
            <ul className="qa-suites">
              {suites.map((name) => {
                const inSuite = rows.filter((r) => r.suite === name);
                const projects = [...new Set(inSuite.map((r) => r.project))];
                return (
                  <li key={name}>
                    <h3>{name}</h3>
                    <div>
                      {projects.map((p) => {
                        const mine = inSuite.filter((r) => r.project === p);
                        const on =
                          filter?.suite === name && filter.project === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            className="qa-pill"
                            aria-pressed={on}
                            disabled={running}
                            onClick={() => toggle(name, p)}
                            title={`Replay ${name} on ${p} alone`}
                          >
                            {p} {mine.filter((r) => r.ok).length}/{mine.length}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="qa-runner">
              <ul
                className="qa-log"
                aria-label="Test run output"
                aria-live="polite"
              >
                {shown.map((l, i) => (
                  <li key={i} data-tone={l.tone}>
                    {l.text}
                  </li>
                ))}
              </ul>
              <div className="qa-action">
                <button
                  type="button"
                  className="qa-run-btn"
                  disabled={running}
                  onClick={replay}
                >
                  {running
                    ? 'Running'
                    : replayed
                      ? 'Run again'
                      : filter
                        ? `Run ${label}`
                        : 'Run the QA suites'}
                </button>
                <span>
                  {runApi
                    ? 'Starts the workflow on GitHub Actions. A run takes a few minutes.'
                    : 'Replays the last run recorded by CI. It is not a new run.'}
                </span>
              </div>
            </div>
          </div>
          {history.length > 0 && (
            <div className="qa-trend" aria-label="Wall time of recent runs">
              {history.map((h) => (
                <div
                  key={h.number}
                  data-fail={h.failed > 0}
                  title={`CI #${h.number}: ${h.passed} passed, ${h.failed} failed, ${h.duration}s`}
                >
                  <span
                    style={{
                      height: `${Math.max(6, (h.duration / widest) * 100)}%`,
                    }}
                  />
                  <small>#{h.number}</small>
                </div>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <ul className="qa-history" aria-label="Previous runs">
              {[...history].reverse().map((h) => (
                <li key={h.number}>
                  <button
                    type="button"
                    aria-pressed={!lines.length && past?.number === h.number}
                    disabled={running}
                    onClick={() => view(h.number)}
                    title="Show this run's steps"
                  >
                    <b>CI #{h.number}</b>
                    <span>{h.commit ?? ''}</span>
                    <span>{h.publishedAt?.slice(0, 10) ?? ''}</span>
                    <span data-fail={h.failed > 0}>
                      {h.failed > 0
                        ? `${h.failed} failed`
                        : `${h.passed} passed`}
                    </span>
                    <span>{h.duration}s</span>
                  </button>
                  {h.url && (
                    <a href={h.url} target="_blank" rel="noreferrer">
                      CI run ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="qa-links">
            <span>PUBLISHED ON EVERY PUSH TO MAIN</span>
            <a href={`${base}/qa/report/`}>Playwright Report</a>
            <a href={data.run.workflowUrl} target="_blank" rel="noreferrer">
              Run the workflow
            </a>
          </div>
        </>
      )}
    </section>
  );
}
