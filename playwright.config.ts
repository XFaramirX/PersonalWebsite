import { defineConfig, devices, type ReporterDescription } from '@playwright/test';

// Set BASE_URL to test a deployed site instead of the local static build.
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

// Allure results feed the published Allure report; the blob/html reports stay for traces.
const allure: ReporterDescription = [
  'allure-playwright',
  {
    resultsDir: 'allure-results',
    environmentInfo: {
      Target: 'Local static build of this site',
      Node: process.version,
      OS: `${process.platform} ${process.arch}`,
      CI: process.env.CI ? 'GitHub Actions' : 'local',
      Commit: process.env.GITHUB_SHA?.slice(0, 7) ?? 'working tree',
      Branch: process.env.GITHUB_REF_NAME ?? 'local',
    },
  },
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  // CI writes blobs; the publish job merges them into the JSON and HTML reports.
  reporter: process.env.CI
    ? [['list'], ['blob'], allure]
    : [['list'], ['html', { open: 'never' }], allure],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'pnpm dlx serve out -l 3000',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
      },
});
