import { test, expect, type Page } from '@playwright/test';

const run = {
  number: '7',
  branch: 'main',
  commit: 'abc1234',
  publishedAt: '2026-10-12T14:00:00Z',
  url: 'https://github.com/example/repo/actions/runs/1',
  workflowUrl: 'https://github.com/example/repo/actions/workflows/ci.yml',
  environment: { viewport: '1280x720', pipeline: 'GitHub Actions' },
};

const spec = (title: string, projectName: string, duration: number) => ({
  title,
  tests: [{ projectName, results: [{ status: 'passed', duration }] }],
});

const results = {
  stats: { duration: 4200 },
  suites: [
    {
      title: 'demo.spec.ts',
      suites: [
        {
          title: 'Demo suite',
          specs: [spec('DEMO-01: first case', 'chromium', 800), spec('DEMO-02: second case', 'webkit', 1200)],
        },
      ],
    },
  ],
};

const history = [
  { number: '6', passed: 2, failed: 0, duration: 5 },
  {
    number: '7',
    passed: 2,
    failed: 0,
    duration: 4,
    commit: 'abc1234',
    publishedAt: '2026-10-12T14:00:00Z',
    tests: [
      { suite: 'Demo suite', title: 'DEMO-01: first case', project: 'chromium', ok: true, ms: 800 },
    ],
  },
];

// Serves fixed QA data so the dashboard is tested independently of any CI run.
async function mockQaData(page: Page) {
  await page.route('**/qa/run.json*', (r) => r.fulfill({ json: run }));
  await page.route('**/qa/results.json*', (r) => r.fulfill({ json: results }));
  await page.route('**/qa/history.json*', (r) => r.fulfill({ json: history }));
  await page.route('**/qa/allure/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<p>report</p>' }),
  );
}

test.describe('CI results dashboard', { tag: '@dashboard' }, () => {
  test.beforeEach(async ({ page }) => {
    await mockQaData(page);
    await page.goto('./');
  });

  test('DASH-01: shows the latest published run', async ({ page }) => {
    await expect(page.getByText('CI #7').first()).toBeVisible();
    await expect(page.getByText('abc1234').first()).toBeVisible();
    await expect(page.getByText('100%')).toBeVisible();
  });

  test('DASH-02: the summary panels and report stay hidden until a run', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'What that run says' })).toHaveCount(0);
    await expect(page.getByTitle('Allure report')).toHaveCount(0);
  });

  test('DASH-03: running the suites replays the run and reveals the report', async ({ page }) => {
    await page.getByRole('button', { name: 'Run the QA suites' }).click();
    await expect(page.getByRole('heading', { name: 'What that run says' })).toBeVisible();
    await expect(page.getByLabel('Test run output')).toContainText('2 of 2 passed');
    await expect(page.getByTitle('Allure report')).toBeVisible();
  });

  test('DASH-04: a browser chip narrows the steps to that browser', async ({ page }) => {
    await page.getByRole('button', { name: /^webkit/ }).click();
    const log = page.getByLabel('Test run output');
    await expect(log).toContainText('DEMO-02');
    await expect(log).not.toContainText('DEMO-01');
  });

  test('DASH-05: history shows a past run and says when steps were not recorded', async ({ page }) => {
    await page.getByRole('button', { name: /CI #6/ }).click();
    await expect(page.getByLabel('Test run output')).toContainText('Steps were not recorded');
    await page.getByRole('button', { name: /CI #7/ }).click();
    await expect(page.getByLabel('Test run output')).toContainText('DEMO-01');
  });
});
