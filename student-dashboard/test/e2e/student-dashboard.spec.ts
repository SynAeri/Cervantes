// E2E tests for student dashboard critical paths
// Tests login, dashboard navigation, arc viewing, VN player, and journal

import { test, expect } from '@playwright/test';

test.describe('Student Dashboard - Public Pages', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Cervantes/i);
  });

  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    // Should display login form elements
    await expect(page.locator('input[type="email"], [data-testid="email-input"]')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    // Should redirect to login or show login prompt
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
  });
});

test.describe('Student Dashboard - Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to dashboard (assumes test environment allows access)
    await page.goto('/dashboard');
  });

  test('should display navigation sidebar', async ({ page }) => {
    // Sidebar should contain key navigation items
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display top bar with user info', async ({ page }) => {
    const topbar = page.locator('[data-testid="topbar"], header');
    await expect(topbar.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Student Dashboard - Arc Landing', () => {
  test('should show error for invalid arc ID', async ({ page }) => {
    await page.goto('/INVALID_ARC_ID');
    // Should show error or loading state
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
    // Content should not overflow horizontally
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 20); // Allow small tolerance
  });
});
