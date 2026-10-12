import { test, expect } from '@playwright/test';

test.describe('Portfolio smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
  });

  test('SITE-01: page loads with a title', async ({ page }) => {
    await expect(page).toHaveTitle(/.+/);
  });

  test('SITE-02: main navigation exposes every section', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Portfolio sections' });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(8);
  });

  test('SITE-03: contact section is present', async ({ page }) => {
    await expect(page.locator('#contact')).toBeAttached();
  });
});
