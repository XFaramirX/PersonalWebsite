'use client';

import { useEffect, useRef, useState } from 'react';

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

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

const getJson = (path: string) =>
  fetch(`${base}/qa/${path}`).then((r) => (r.ok ? r.json() : Promise.reject()));

export function QaDashboard() {
  const [data, setData] = useState<{ run: Run; report: PwReport } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [replayed, setReplayed] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    Promise.all([getJson('run.json'), getJson('results.json')])
      .then(([run, report]) => alive.current && setData({ run, report }))
      .catch(() => setData(null));
    getJson('history.json')
      .then((h) => alive.current && setHistory(h))
      .catch(() => setHistory([]));
    return () => {
      alive.current = false;
    };
  }, []);

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

  async function replay() {
    if (running) return;
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
                {lines.length === 0 && (
                  <li data-tone="muted">
                    {
                      '> Waiting for a run. Run the QA suites replays the latest run published by CI, test by test.'
                    }
                  </li>
                )}
                {lines.map((l, i) => (
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
                  Replays the last run recorded by CI. It is not a new run.
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
