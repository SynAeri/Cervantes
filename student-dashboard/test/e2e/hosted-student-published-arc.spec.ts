import { test, expect, Page } from '@playwright/test';

const STUDENT_BASE_URL =
  process.env.STUDENT_BASE_URL ||
  'https://cervantes-backend-prod--cervantes-caebc.asia-southeast1.hosted.app';
const ARC_ID = process.env.E2E_ARC_ID || '51c85c56-2e06-4e15-8d5e-ca99079b0e3c';
const STUDENT_ID = process.env.E2E_STUDENT_ID || '10234567';

async function completeScene(page: Page) {
  for (let step = 0; step < 100; step += 1) {
    const advancePanel = page.locator('div.cursor-pointer').filter({
      has: page.locator('span:has-text("keyboard_double_arrow_right")'),
    }).first();
    if (await advancePanel.isVisible().catch(() => false)) {
      await advancePanel.click();
      await page.waitForTimeout(800);
      continue;
    }

    const multiSubmit = page.getByRole('button', { name: /submit answer/i });
    if (await multiSubmit.isVisible().catch(() => false)) {
      const areas = page.locator('textarea');
      const count = await areas.count();
      for (let i = 0; i < count; i += 1) {
        await areas.nth(i).fill(
          `GDP, unemployment, inflation, CPI, and government intervention all shape incentives here. Response part ${i + 1}.`
        );
      }
      await multiSubmit.click();
      await page.waitForTimeout(1500);
      continue;
    }

    const submit = page.getByRole('button', { name: /^submit$/i });
    if (await submit.isVisible().catch(() => false)) {
      await page.locator('textarea').first().fill(
        'GDP, inflation, and unemployment should be interpreted together, and policy intervention changes the trade-offs for firms and workers.'
      );
      await submit.click();
      await page.waitForTimeout(1500);
      continue;
    }

    const choiceButtons = page.locator('button').filter({ has: page.locator('span.text-terracotta') });
    const choiceCount = await choiceButtons.count().catch(() => 0);
    if (choiceCount > 0) {
      await choiceButtons.first().click();
      await page.waitForTimeout(1000);
      continue;
    }

    const continueButton = page.getByRole('button', { name: /continue|next|finish|complete/i }).first();
    if (await continueButton.isVisible().catch(() => false)) {
      await continueButton.click();
      await page.waitForTimeout(800);
      continue;
    }

    break;

    if (page.url().includes('/arc-ending/') || page.url().includes('/journal')) {
      break;
    }
  }
}

test('student can enter published economics arc and reach ending or journal', async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);

  await page.goto(`${STUDENT_BASE_URL}/${ARC_ID}`);
  await page.locator('input[type="text"]').fill(STUDENT_ID);
  await page.getByRole('button', { name: /access assessment/i }).click();

  await page.waitForURL(/\/scene\//, { timeout: 60_000 });
  await expect(page.locator('body')).toContainText(/1\/5|2\/5|Dialogue appears here as you progress/i, {
    timeout: 60_000,
  });

  for (let i = 0; i < 6; i += 1) {
    if (page.url().includes('/arc-ending/') || page.url().includes('/journal')) {
      break;
    }
    await completeScene(page);
    await page.waitForTimeout(1500);
  }

  await expect(page.locator('body')).toContainText(/Reflection|Journal|Ending|Complete/i, {
    timeout: 180_000,
  });
});
