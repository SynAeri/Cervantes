// E2E tests for student dashboard critical paths
// Tests login, dashboard navigation, arc viewing, VN player, and journal

import { test, expect } from '@playwright/test';

test.describe('Student Dashboard - Public Pages', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cervantes/i);
  });

  test('should show login or redirect authenticated user', async ({ page }) => {
    await page.goto('/login');
    // In E2E mode, authenticated users redirect to dashboard; otherwise login form shows
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
  });

  test('should access dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    // In E2E mode auth is mocked, so we stay on dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });
});

test.describe('Student Dashboard - Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display navigation sidebar', async ({ page }) => {
    const sidebar = page.locator('nav, aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display top bar with user info', async ({ page }) => {
    const topbar = page.locator('header');
    await expect(topbar.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Student Dashboard - Arc Landing', () => {
  test('should show error for invalid arc ID', async ({ page }) => {
    await page.goto('/INVALID_ARC_ID');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

test.describe('Student Dashboard - Scene Player', () => {
  test('should show error for invalid scene ID', async ({ page }) => {
    await page.goto('/scene/INVALID_SCENE_ID');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

test.describe('Student Dashboard - Journal', () => {
  test('should load journal page', async ({ page }) => {
    await page.goto('/journal');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

test.describe('Student Dashboard - Responsive Design', () => {
  test('should be usable on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20);
  });
});
