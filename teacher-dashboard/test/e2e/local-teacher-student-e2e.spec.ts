import path from 'path';
import { test, expect, Page } from '@playwright/test';

const TEACHER_BASE_URL = process.env.TEACHER_BASE_URL || 'http://localhost:3100';
const STUDENT_BASE_URL =
  process.env.STUDENT_BASE_URL ||
  'https://cervantes-backend-prod--cervantes-caebc.asia-southeast1.hosted.app';
const STUDENT_ID = process.env.E2E_STUDENT_ID || '10234567';

async function dismissDialogs(page: Page) {
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
}

async function completeScene(page: Page) {
  for (let step = 0; step < 80; step += 1) {
    const advancePanel = page.locator('div.cursor-pointer').filter({
      has: page.locator('span:has-text("keyboard_double_arrow_right")'),
    }).first();
    if (await advancePanel.isVisible().catch(() => false)) {
      await advancePanel.click();
      await page.waitForTimeout(800);
      continue;
    }

    const submitMulti = page.getByRole('button', { name: /submit answer/i });
    if (await submitMulti.isVisible().catch(() => false)) {
      const areas = page.locator('textarea');
      const count = await areas.count();
      for (let i = 0; i < count; i += 1) {
        await areas.nth(i).fill(
          `GDP, unemployment, CPI, and government policy all affect business decisions in this scenario. Part ${i + 1}.`
        );
      }
      await submitMulti.click();
      await page.waitForTimeout(1500);
      continue;
    }

    const submit = page.getByRole('button', { name: /^submit$/i });
    if (await submit.isVisible().catch(() => false)) {
      await page.locator('textarea').first().fill(
        'GDP, unemployment, and inflation influence the case here, and government intervention changes costs, incentives, and labor choices.'
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

    const accessAssessment = page.getByRole('button', { name: /access assessment/i });
    if (await accessAssessment.isVisible().catch(() => false)) {
      break;
    }

    const nextCandidates = [
      page.getByRole('button', { name: /continue/i }),
      page.getByRole('button', { name: /next/i }),
      page.getByRole('button', { name: /finish/i }),
      page.getByRole('button', { name: /complete/i }),
      page.locator('button').filter({ hasText: 'arrow_forward' }).first(),
      page.locator('button').filter({ hasText: 'keyboard_arrow_right' }).first(),
    ];

    let clicked = false;
    for (const candidate of nextCandidates) {
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        await page.waitForTimeout(600);
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      break;
    }

    if (page.url().includes('/arc-ending/') || page.url().includes('/journal')) {
      break;
    }
  }
}

test('teacher can generate and publish economics arc, then student can enter and progress', async ({
  browser,
}) => {
  test.setTimeout(10 * 60 * 1000);

  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await dismissDialogs(teacherPage);

  const email = `codex.${Date.now()}@example.com`;
  const password = 'CodexTest123!';
  const filePath = path.resolve(__dirname, 'fixtures/economics-goals.txt');

  await teacherPage.goto(`${TEACHER_BASE_URL}/login`);
  await teacherPage.getByText(/Need an account\? Sign up/i).click();
  await teacherPage.locator('input[type="email"]').fill(email);
  await teacherPage.locator('input[type="password"]').fill(password);
  await teacherPage.getByRole('button', { name: /create account/i }).click();

  await teacherPage.waitForURL(/\/dashboard/, { timeout: 60_000 });
  await teacherPage.goto(`${TEACHER_BASE_URL}/class/ECON101/arc/new`);
  await teacherPage.locator('#file-upload').setInputFiles(filePath);
  await teacherPage.getByRole('button', { name: /process documents/i }).click();

  await expect(teacherPage.getByText(/Review Generated Arc/i)).toBeVisible({ timeout: 180_000 });
  await expect(teacherPage.locator('body')).toContainText(/GDP/i, { timeout: 30_000 });
  await expect(teacherPage.locator('body')).toContainText(/Unemployment|Labou?r/i, { timeout: 30_000 });

  const totalScenes = teacherPage.getByText(/scenes$/i).filter({ hasText: /scenes/i }).first();
  await expect(totalScenes).not.toContainText(/^0 scenes$/i);

  const arcIdLabel = teacherPage.getByText(/Arc ID/i).locator('..').locator('p').nth(1);
  const arcId = (await arcIdLabel.textContent())?.trim();
  expect(arcId).toBeTruthy();

  await teacherPage.getByRole('button', { name: /approve arc/i }).click();
  await expect(teacherPage.getByText(/Arc Approved!/i)).toBeVisible({ timeout: 60_000 });
  await teacherPage.getByRole('button', { name: /view arc details/i }).click();
  await teacherPage.waitForURL(new RegExp(`/arc/${arcId}`), { timeout: 60_000 });
  await expect(teacherPage.getByRole('button', { name: /publish arc/i })).toBeVisible({ timeout: 60_000 });
  await teacherPage.getByRole('button', { name: /publish arc/i }).click();
  await expect(teacherPage.locator('body')).toContainText(/PUBLISHED/i, { timeout: 240_000 });

  await teacherContext.close();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();

  await studentPage.goto(`${STUDENT_BASE_URL}/${arcId}`);
  await studentPage.locator('input[placeholder*="10234567"], input[type="text"]').fill(STUDENT_ID);
  await studentPage.getByRole('button', { name: /access assessment/i }).click();

  await studentPage.waitForURL(/\/scene\//, { timeout: 60_000 });
  await expect(studentPage.locator('body')).toContainText(/1\/5|2\/5|Dialogue appears here as you progress/i, {
    timeout: 60_000,
  });

  for (let i = 0; i < 5; i += 1) {
    if (studentPage.url().includes('/arc-ending/') || studentPage.url().includes('/journal')) {
      break;
    }

    await completeScene(studentPage);
    await studentPage.waitForTimeout(1500);
  }

  await expect(studentPage.locator('body')).toContainText(/Reflection|Journal|Ending|Complete/i, {
    timeout: 180_000,
  });

  await studentContext.close();
});
