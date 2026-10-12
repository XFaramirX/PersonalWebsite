import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', { tag: '@a11y' }, () => {
  test('A11Y-01: the page has no WCAG 2.1 A/AA violations', async ({ page }, testInfo) => {
    await page.goto('./');
    const results = await new AxeBuilder({ page })
      .include('body')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    await testInfo.attach('axe-violations', {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });
    expect(results.violations).toEqual([]);
  });
});
