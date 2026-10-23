import { test, expect } from '@playwright/test';

test('UIU Calculator basic layout and tracer value', async ({ page }) => {
  await page.goto('/');

  // Header should be present
  await expect(page.getByRole('heading', { name: 'UIU Calculator' })).toBeVisible();

  // The tracer value should be displayed correctly (from the hardcoded CSE 1101, 3 cr, A = 4.00)
  await expect(page.getByText('Tracer TermGpa: 4.00')).toBeVisible();

  // Footer text check (EffectiveDate and verify link)
  const footer = page.locator('footer');
  await expect(footer).toContainText('2026-10-23');
  await expect(footer).toContainText('verify with UIU');
});
