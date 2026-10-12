import { test, expect } from '@playwright/test';

test.describe('Portfolio smoke', { tag: '@smoke' }, () => {
  test('SITE-01: page loads with a title', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle(/.+/);
  });

  test('SITE-02: main navigation links every section', async ({ page }) => {
    await page.goto('./');
    const nav = page.getByRole('navigation', { name: 'Portfolio sections' });
    await expect(nav.getByRole('link')).toHaveCount(9);
  });

  test('SITE-03: every navigation link targets a section on the page', async ({
    page,
  }) => {
    await page.goto('./');
    const hrefs = await page
      .getByRole('navigation', { name: 'Portfolio sections' })
      .getByRole('link')
      .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
    for (const href of hrefs) {
      await test.step(`Anchor ${href}`, async () => {
        await expect(page.locator(href!)).toBeAttached();
      });
    }
  });

  test('SITE-04: loading the page raises no console or page errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await page.goto('./');
    await page.waitForLoadState('networkidle');
    // Missing QA data on a local build is expected; anything else is not.
    expect(errors.filter((e) => !/qa\/.*\.json|Failed to load resource/.test(e))).toEqual([]);
  });

  test('SITE-05: external links open safely', async ({ page }) => {
    await page.goto('./');
    const links = page.locator('a[target="_blank"]');
    expect(await links.count()).toBeGreaterThan(0);
    for (const rel of await links.evaluateAll((as) =>
      as.map((a) => a.getAttribute('rel') ?? ''),
    )) {
      expect(rel).toMatch(/noreferrer|noopener/);
    }
  });

  test('SITE-06: the navigation highlights the section in view', async ({
    page,
  }) => {
    await page.goto('./');
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('link', { name: /Skills/ }).first(),
    ).toHaveAttribute('aria-current', 'true');
  });

  test('SITE-07: the CV link serves a PDF', async ({
    page,
  }) => {
    await page.goto('./');
    const href = await page
      .getByRole('link', { name: /^CV/ })
      .first()
      .getAttribute('href');
    const response = await page.request.get(href!);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('pdf');
  });

  test('SITE-08: the logo link label starts with its visible text', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(page.locator('.wordmark')).toHaveAttribute(
      'aria-label',
      /^JD\./,
    );
  });
});
