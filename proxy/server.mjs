// Starts the QA workflow on behalf of the page so the GitHub token never reaches the browser.
import { createServer } from 'node:http';

const {
  GITHUB_TOKEN,
  GITHUB_REPO = 'XFaramirX/PersonalWebsite',
  WORKFLOW = 'playwright.yml',
  REF = 'main',
  ALLOWED_ORIGIN = 'http://localhost:3000',
  PORT = '8787',
  COOLDOWN_MS = '300000',
} = process.env;

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is required (see proxy/.env.example)');
  process.exit(1);
}

const api = (path, init = {}) =>
  fetch(`https://api.github.com/repos/${GITHUB_REPO}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

let lastDispatch = 0;
let cached = { at: 0, body: null };
let jobsCache = { id: 0, at: 0, body: [] };

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
};

createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') return send(res, 204, null);

  const url = new URL(req.url, 'http://localhost');
  try {
    if (req.method === 'POST' && url.pathname === '/run') {
      const wait = lastDispatch + Number(COOLDOWN_MS) - Date.now();
      if (wait > 0) {
        return send(res, 429, { error: 'cooldown', retryAfterMs: wait });
      }
      const r = await api(`/actions/workflows/${WORKFLOW}/dispatches`, {
        method: 'POST',
        body: JSON.stringify({ ref: REF }),
      });
      if (r.status !== 204) return send(res, 502, { error: 'dispatch failed' });
      lastDispatch = Date.now();
      return send(res, 202, { startedAt: new Date(lastDispatch).toISOString() });
    }

    if (req.method === 'GET' && url.pathname === '/status') {
      const since = Date.parse(url.searchParams.get('since') ?? '') || 0;
      // Many visitors can poll; one upstream call per few seconds is enough.
      if (Date.now() - cached.at > 4000) {
        const r = await api(
          `/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&branch=${REF}&per_page=5`,
        );
        if (!r.ok) return send(res, 502, { error: 'status failed' });
        cached = { at: Date.now(), body: (await r.json()).workflow_runs };
      }
      // GitHub timestamps trail the dispatch by a moment; allow 10s of skew.
      const run = cached.body.find((x) => Date.parse(x.created_at) >= since - 10000);
      if (!run) return send(res, 200, { status: 'pending', conclusion: null, url: null, jobs: [] });

      if (jobsCache.id !== run.id || Date.now() - jobsCache.at > 4000) {
        const j = await api(`/actions/runs/${run.id}/jobs`);
        jobsCache = {
          id: run.id,
          at: Date.now(),
          body: j.ok
            ? (await j.json()).jobs.map(({ name, status, conclusion }) => ({ name, status, conclusion }))
            : [],
        };
      }
      return send(res, 200, {
        status: run.status,
        conclusion: run.conclusion,
        url: run.html_url,
        jobs: jobsCache.body,
      });
    }

    send(res, 404, { error: 'not found' });
  } catch {
    send(res, 500, { error: 'proxy error' });
  }
}).listen(Number(PORT), () => console.log(`QA proxy on http://localhost:${PORT}`));
