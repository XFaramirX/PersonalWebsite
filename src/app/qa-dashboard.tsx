'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

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
  environment?: Record<string, string>;
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
type Status = 'passed' | 'failed' | 'broken' | 'skipped';
const STATUSES: Status[] = ['passed', 'failed', 'broken', 'skipped'];
type Row = {
  suite: string;
  title: string;
  project: string;
  ok: boolean;
  ms: number;
  status?: Status;
};

// Playwright's timeouts and interruptions are the suite breaking, not the app failing.
function statusOf(status: string | undefined): Status {
  if (status === 'passed') return 'passed';
  if (status === 'skipped') return 'skipped';
  if (status === 'timedOut' || status === 'interrupted') return 'broken';
  return 'failed';
}
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
      const status = statusOf(t.results.at(-1)?.status);
      rows.push({
        suite: name,
        title: spec.title,
        project: t.projectName,
        ok: status === 'passed',
        status,
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

type PipeKey = 'push' | 'chromium' | 'webkit' | 'publish' | 'gate';
type PipeState = 'idle' | 'running' | 'done' | 'fail';
type Pipe = Record<PipeKey, PipeState>;
const PIPE_START: Pipe = {
  push: 'done',
  chromium: 'idle',
  webkit: 'idle',
  publish: 'idle',
  gate: 'idle',
};
const PIPE_NAMES: Record<PipeKey, string> = {
  push: 'Push to main',
  chromium: 'Chromium',
  webkit: 'WebKit',
  publish: 'Reports + deploy',
  gate: 'CI gate',
};
const PIPE_WORD: Record<PipeState, string> = {
  idle: 'queued',
  running: 'running',
  done: 'passed',
  fail: 'failed',
};
const JOB_KEY: Record<string, PipeKey> = {
  'e2e-chromium': 'chromium',
  'e2e-webkit': 'webkit',
  publish: 'publish',
  'ci-gate': 'gate',
};

function groupState(...states: PipeState[]): PipeState {
  if (states.includes('fail')) return 'fail';
  if (states.includes('running')) return 'running';
  return states.every((s) => s === 'done') ? 'done' : 'idle';
}

function PipeViz({ pipe }: { pipe: Pipe }) {
  const node = (k: PipeKey) => (
    <div className="pipe-node" data-state={pipe[k]}>
      <b>{PIPE_NAMES[k]}</b>
      <small>{PIPE_WORD[pipe[k]]}</small>
    </div>
  );
  return (
    <div className="qa-pipe" role="group" aria-label="Pipeline stages">
      {node('push')}
      <i
        className="pipe-link"
        aria-hidden="true"
        data-state={groupState(pipe.chromium, pipe.webkit)}
      />
      <div className="pipe-par">
        {node('chromium')}
        {node('webkit')}
      </div>
      <i className="pipe-link" aria-hidden="true" data-state={pipe.publish} />
      {node('publish')}
      <i className="pipe-link" aria-hidden="true" data-state={pipe.gate} />
      {node('gate')}
    </div>
  );
}

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Counts up to the value; jumps straight there for reduced motion.
function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [reduce] = useState(prefersReducedMotion);
  const [v, setV] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, reduce]);
  return (
    <>
      {Math.round(reduce ? to : v)}
      {suffix}
    </>
  );
}

export function QaDashboard() {
  const [data, setData] = useState<{ run: Run; report: PwReport } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<Filter>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [running, setRunning] = useState(false);
  const [replayed, setReplayed] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const runnerRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [livePipe, setLivePipe] = useState<Pipe | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!revealed) return;
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    panelsRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [revealed]);

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
    setLines([]);
    setLivePipe(null);
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
      setLivePipe(PIPE_START);

      const seen = new Map<string, string>();
      for (let i = 0; i < 180 && alive.current; i++) {
        await pause(5000);
        const s = await (
          await fetch(`${runApi}/status?since=${encodeURIComponent(startedAt)}`)
        ).json();
        const next: Partial<Pipe> = {};
        for (const job of s.jobs ?? []) {
          const key = JOB_KEY[job.name];
          if (key) {
            next[key] =
              job.status === 'completed'
                ? job.conclusion === 'success'
                  ? 'done'
                  : job.conclusion === 'skipped'
                    ? 'idle'
                    : 'fail'
                : job.status === 'in_progress'
                  ? 'running'
                  : 'idle';
          }
        }
        setLivePipe((p) => ({ ...(p ?? PIPE_START), ...next }));
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
          setLivePipe(null);
          setReplayed(true);
          setRevealed(true);
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
    const setNode = (k: PipeKey, s: PipeState) =>
      setLivePipe((p) => ({ ...(p ?? PIPE_START), [k]: s }));
    const browsers = projects.filter(
      (p): p is 'chromium' | 'webkit' => p === 'chromium' || p === 'webkit',
    );
    setLivePipe(PIPE_START);
    await sleep(350);
    browsers.forEach((k) => setNode(k, 'running'));
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
      const mine = browsers.find((b) => b === project);
      if (mine) {
        const good = picked
          .filter((x) => x.project === project)
          .every((x) => x.ok);
        setNode(mine, good ? 'done' : 'fail');
      }
    }
    setNode('publish', 'running');
    await sleep(700);
    setNode('publish', 'done');
    setNode('gate', 'running');
    await sleep(450);
    setNode('gate', picked.every((r) => r.ok) ? 'done' : 'fail');
    const ok = picked.filter((r) => r.ok).length;
    push({
      text: `${ok} of ${picked.length} passed (${wall}s wall time)`,
      tone: 'head',
    });
    setRunning(false);
    setReplayed(true);
    setRevealed(true);
  }

  const widest = Math.max(1, ...history.map((h) => h.duration));
  const counts = Object.fromEntries(
    STATUSES.map((s) => [
      s,
      rows.filter((r) => (r.status ?? 'failed') === s).length,
    ]),
  ) as Record<Status, number>;
  const rate = rows.length ? passed / rows.length : 0;
  const slowest = [...rows].sort((a, b) => b.ms - a.ms).slice(0, 5);
  const projects = [...new Set(rows.map((r) => r.project))];
  const env = [
    ['Target', data?.run.environment?.target],
    ['Browser', projects.join(' and ')],
    ['Viewport', data?.run.environment?.viewport],
    ['Runner', data?.run.environment?.runner],
    ['Pipeline', data?.run.environment?.pipeline],
  ].filter((e): e is [string, string] => !!e[1]);
  const circumference = 2 * Math.PI * 52;
  const failedIn = (p: string) => rows.some((r) => r.project === p && !r.ok);
  const idlePipe: Pipe = {
    push: 'done',
    chromium: failedIn('chromium') ? 'fail' : 'done',
    webkit: failedIn('webkit') ? 'fail' : 'done',
    publish: 'done',
    gate: rows.some((r) => !r.ok) ? 'fail' : 'done',
  };
  const pipe = livePipe ?? idlePipe;
  const past = history.find((h) => h.number === viewing);
  const inFilter = (r: Row) =>
    !filter || (r.suite === filter.suite && r.project === filter.project);
  const tag = filter ? ` · ${filter.suite} on ${filter.project}` : '';
  // Live output wins, then a chosen past run, then the latest published run.
  const shown: Line[] = lines.length
    ? lines
    : past
      ? stepLines(
          `> CI #${past.number}${past.commit ? ` · ${past.commit}` : ''}${tag}`,
          past.tests?.filter(inFilter),
        )
      : data
        ? stepLines(
            `> CI #${data.run.number} · ${data.run.commit}${tag}`,
            rows.filter(inFilter),
          )
        : [];

  function view(number: string) {
    if (running) return;
    setLines([]);
    setLivePipe(null);
    setViewing(number);
    // The output panel sits far above the list, so bring it to the reader.
    runnerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <section className="qa-section section-block" id="qa">
      <div className="section-label">
        <span>02</span>
        <span>LIVE CI RESULTS</span>
      </div>
      <div className="project-heading">
        <h2>
          A real pipeline,
          <br />
          <em>running on this page.</em>
        </h2>
        <p>
          This portfolio runs its own Playwright suite in Chromium and WebKit on
          every push to main. Results, history, and the full Allure report below
          are read from that published run.
        </p>
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
          <PipeViz pipe={pipe} />
          <div className="qa-stats">
            <div>
              <strong>
                <CountUp to={rows.length} />
              </strong>{' '}
              RESULTS
            </div>
            <div>
              <strong>
                <CountUp
                  to={new Set(rows.map((r) => `${r.suite}/${r.title}`)).size}
                />
              </strong>{' '}
              DISTINCT CASES
            </div>
            <div>
              <strong>
                <CountUp
                  to={
                    rows.length ? Math.round((passed / rows.length) * 100) : 0
                  }
                  suffix="%"
                />
              </strong>{' '}
              PASSING
            </div>
            <div>
              <strong>
                <CountUp to={wall} suffix="s" />
              </strong>{' '}
              WALL TIME
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
            <div className="qa-runner" ref={runnerRef}>
              <ul
                className="qa-log"
                aria-label="Test run output"
                aria-live="polite"
                data-running={running}
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
                  {revealed
                    ? filter
                      ? `That is ${label} out of the published run. What it says is below, report included.`
                      : 'That is the published run. What it says is below, report included.'
                    : runApi
                      ? "Starts the workflow on GitHub Actions, then opens the new run's report below."
                      : 'Replays the last run recorded in the Allure report, then opens that report below.'}
                </span>
              </div>
            </div>
          </div>
          {revealed && (
            <div className="qa-panels" ref={panelsRef}>
              <h3>What that run says</h3>
              <p>
                The latest run by outcome, suite, environment, history, and
                slowest tests.
              </p>
              <div className="qa-cards">
                <article className="qa-card">
                  <h4>Pass rate</h4>
                  <div className="qa-ring-row">
                    <svg
                      viewBox="0 0 120 120"
                      role="img"
                      aria-label={`${Math.round(rate * 100)} per cent passed`}
                    >
                      <circle
                        className="qa-ring-track"
                        cx="60"
                        cy="60"
                        r="52"
                      />
                      <circle
                        className={
                          rate < 1 ? 'qa-ring-fill is-off' : 'qa-ring-fill'
                        }
                        cx="60"
                        cy="60"
                        r="52"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference * (1 - rate)}
                        transform="rotate(-90 60 60)"
                      />
                      <text x="60" y="60" className="qa-ring-v">
                        {Math.round(rate * 100)}%
                      </text>
                      <text x="60" y="78" className="qa-ring-l">
                        {rows.length} tests
                      </text>
                    </svg>
                    <ul className="qa-legend">
                      {STATUSES.map((s) => (
                        <li key={s} data-status={s}>
                          <span />
                          {s[0].toUpperCase() + s.slice(1)}
                          <b>{counts[s]}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
                <article className="qa-card">
                  <h4>Suites</h4>
                  {suites.map((name) => {
                    const inSuite = rows.filter((r) => r.suite === name);
                    const time = inSuite.reduce((s, r) => s + r.ms, 0) / 1000;
                    return (
                      <div key={name} className="qa-suite-card">
                        <b>{name}</b>
                        <small>
                          {inSuite.filter((r) => r.ok).length} of{' '}
                          {inSuite.length} passed
                        </small>
                        <div className="qa-bar">
                          {STATUSES.map((s) => {
                            const n = inSuite.filter(
                              (r) => (r.status ?? 'failed') === s,
                            ).length;
                            return n ? (
                              <span
                                key={s}
                                data-status={s}
                                style={{
                                  width: `${(n / inSuite.length) * 100}%`,
                                }}
                                title={`${n} ${s}`}
                              />
                            ) : null;
                          })}
                        </div>
                        <small>
                          {time.toFixed(1)}s of test time on{' '}
                          {[...new Set(inSuite.map((r) => r.project))].join(
                            ' and ',
                          )}
                        </small>
                      </div>
                    );
                  })}
                </article>
                <article className="qa-card">
                  <h4>Environment</h4>
                  <dl className="qa-env">
                    {env.map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
                <article className="qa-card">
                  <h4>Run history</h4>
                  <p>
                    Wall time of the last {history.length} runs, newest on the
                    right. Red bars had failures.
                  </p>
                  {history.length > 0 && (
                    <div
                      className="qa-trend"
                      aria-label="Wall time of recent runs"
                    >
                      {history.map((h, i) => (
                        <div
                          key={h.number}
                          data-fail={h.failed > 0}
                          title={`CI #${h.number}: ${h.passed} passed, ${h.failed} failed, ${h.duration}s`}
                        >
                          <span
                            style={
                              {
                                height: `${Math.max(6, (h.duration / widest) * 100)}%`,
                                '--i': i,
                              } as CSSProperties
                            }
                          />
                          <small>#{h.number}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
                <article className="qa-card">
                  <h4>Slowest tests</h4>
                  <p>The five longest tests.</p>
                  <ol className="qa-slow">
                    {slowest.map((r, i) => (
                      <li key={i}>
                        <span>
                          {r.title} <small>[{r.project}]</small>
                        </span>
                        <i
                          style={{
                            width: `${(r.ms / (slowest[0]?.ms || 1)) * 100}%`,
                          }}
                        />
                        <b>{(r.ms / 1000).toFixed(1)}s</b>
                      </li>
                    ))}
                  </ol>
                </article>
              </div>
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
                    {h.commit && <span>{h.commit}</span>}
                    {h.publishedAt && <span>{h.publishedAt.slice(0, 10)}</span>}
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
          {revealed && (
            <div className="qa-embed">
              <div>
                <span>
                  Allure report, published by GitHub Actions on{' '}
                  {data.run.publishedAt.slice(0, 10)}
                </span>
                <a
                  href={`${dataBase}/allure/`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open the full report ↗
                </a>
              </div>
              <iframe src={`${dataBase}/allure/`} title="Allure report" />
            </div>
          )}
          <div className="qa-links">
            <span>PUBLISHED ON EVERY PUSH TO MAIN</span>
            <a href={`${dataBase}/allure/`}>Allure Report</a>
            <a href={`${dataBase}/report/`}>Trace Viewer</a>
            <a href={data.run.workflowUrl} target="_blank" rel="noreferrer">
              Run the workflow
            </a>
          </div>
        </>
      )}
    </section>
  );
}
