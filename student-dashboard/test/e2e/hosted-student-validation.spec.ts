import { test, expect } from '@playwright/test';

const STUDENT_BASE_URL =
  process.env.HOSTED_STUDENT_URL ||
  'https://cervantes-backend-prod--cervantes-caebc.asia-southeast1.hosted.app';

test.describe('Hosted Student Validation', () => {
  test('student demo account can sign in and land on the dashboard', async ({ page }) => {
    await page.goto(`${STUDENT_BASE_URL}/login`);
    await page.locator('input').fill('10234567');
    await page.getByRole('button', { name: /enter/i }).click({ force: true });

    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByText(/SIGN OUT/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/JOURNAL/i)).toBeVisible();
  });

  test('journal opens with an active arc context', async ({ page }) => {
    await page.goto(`${STUDENT_BASE_URL}/login`);
    await page.locator('input').fill('10234567');
    await page.getByRole('button', { name: /enter/i }).click({ force: true });

    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await page.getByText(/JOURNAL/i).first().click({ force: true });

    await expect(page).toHaveURL(/\/journal/, { timeout: 15_000 });
    await expect(page.getByText(/Error loading journal/i)).toHaveCount(0, { timeout: 10_000 });
  });
});
