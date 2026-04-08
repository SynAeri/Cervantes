import path from 'path';
import { test, expect } from '@playwright/test';

const TEACHER_BASE_URL =
  process.env.HOSTED_TEACHER_URL ||
  'https://cervantes-teacher--cervantes-caebc.asia-southeast1.hosted.app';

test.describe('Hosted Teacher Validation', () => {
  test('can register and reach the arc creation workflow', async ({ page }) => {
    const email = `codex.${Date.now()}@example.com`;
    const password = 'CodexTest123!';

    await page.goto(`${TEACHER_BASE_URL}/login`);
    await page.getByText(/Need an account\? Sign up/i).click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await expect(page.getByText(/All Classes/i)).toBeVisible({ timeout: 30_000 });

    await page.goto(`${TEACHER_BASE_URL}/class/ECON101/arc/new`);
    await expect(page.getByText(/Create New Assessment Arc/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Drop assessment documents here/i)).toBeVisible();
  });

  test('uploads economics goals and starts generation', async ({ page }) => {
    test.setTimeout(120_000);

    const email = `codex.${Date.now()}@example.com`;
    const password = 'CodexTest123!';
    const filePath = path.resolve(__dirname, 'fixtures/economics-goals.txt');

    await page.goto(`${TEACHER_BASE_URL}/login`);
    await page.getByText(/Need an account\? Sign up/i).click();
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 60_000 });
    await page.goto(`${TEACHER_BASE_URL}/class/ECON101/arc/new`);

    await page.locator('#file-upload').setInputFiles(filePath);
    await expect(page.getByText(/economics-goals\.txt/i)).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: /process documents/i }).click();

    await expect(
      page.getByText(/Generating Assessment Arc|Review Generated Arc/i)
    ).toBeVisible({ timeout: 90_000 });
  });
});
