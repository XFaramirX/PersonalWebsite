'use client';

import { useEffect, useState } from 'react';

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

type Row = {
  suite: string;
  title: string;
  project: string;
  ok: boolean;
  ms: number;
};

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

export function QaDashboard() {
  const [data, setData] = useState<{ run: Run; report: PwReport } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${base}/qa/run.json`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
      fetch(`${base}/qa/results.json`).then((r) =>
        r.ok ? r.json() : Promise.reject(),
      ),
    ])
      .then(([run, report]) => setData({ run, report }))
      .catch(() => setData(null));
  }, []);

  const rows: Row[] = [];
  data?.report.suites.forEach((s) => flatten(s, s.title, rows));
  const passed = rows.filter((r) => r.ok).length;
  const suites = [...new Set(rows.map((r) => r.suite))];
  const wall = Math.round((data?.report.stats?.duration ?? 0) / 1000);

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
                        return (
                          <span key={p} className="qa-pill">
                            {p} {mine.filter((r) => r.ok).length}/{mine.length}
                          </span>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <ul className="qa-log" aria-label="Test results">
              {rows.map((r, i) => (
                <li key={i} data-ok={r.ok}>
                  {r.ok ? '✓' : '✗'} [{r.project}] {r.title} (
                  {(r.ms / 1000).toFixed(1)}s)
                </li>
              ))}
              <li>
                {passed} of {rows.length} passed · {wall}s wall time
              </li>
            </ul>
          </div>
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
