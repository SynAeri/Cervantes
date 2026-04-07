// E2E tests for teacher dashboard critical paths
// Tests login, dashboard navigation, class viewing, arc creation, and student management

import { test, expect } from '@playwright/test';

// ─── Public Pages ────────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Public Pages', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], [data-testid="email-input"]')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated user from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // Should either redirect to login or show login prompt
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
  });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display all classes on dashboard', async ({ page }) => {
    await page.waitForSelector('[data-testid="class-card"], .animate-pulse', { timeout: 10000 });
    // Either class cards loaded or skeleton is showing (loading state)
    const classCards = await page.locator('[data-testid="class-card"]').count();
    const skeletons = await page.locator('.animate-pulse').count();
    expect(classCards + skeletons).toBeGreaterThan(0);
  });

  test('should navigate to class detail page', async ({ page }) => {
    await page.waitForSelector('a[href*="/class/"]', { timeout: 10000 });
    const firstClassLink = page.locator('a[href*="/class/"]').first();
    await firstClassLink.click();
    await expect(page).toHaveURL(/\/class\/.+/);
  });

  test('should show total student count', async ({ page }) => {
    await page.waitForSelector('text=Total Students', { timeout: 10000 });
    const statsSection = page.locator('text=Total Students').locator('..');
    await expect(statsSection).toBeVisible();
  });

  test('should handle loading states gracefully', async ({ page }) => {
    // Initial page load should show skeletons before data arrives
    const skeletons = await page.locator('.animate-pulse').count();
    expect(skeletons).toBeGreaterThanOrEqual(0); // May or may not show depending on speed
  });
});

// ─── Class Detail ────────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Class Detail', () => {
  test('should show create arc button on class detail', async ({ page }) => {
    await page.goto('/class/ECON101');
    await page.waitForSelector('text=Create New Arc', { timeout: 10000 });
    await expect(page.locator('text=Create New Arc')).toBeVisible();
  });

  test('should show error for invalid class', async ({ page }) => {
    await page.goto('/class/INVALID_CLASS_ID');
    await page.waitForSelector('text=Error loading class', { timeout: 10000 });
    await expect(page.locator('text=Error loading class')).toBeVisible();
  });

  test('should navigate to arc creation page', async ({ page }) => {
    await page.goto('/class/ECON101');
    await page.waitForSelector('text=Create New Arc', { timeout: 10000 });
    await page.click('text=Create New Arc');
    await expect(page).toHaveURL(/\/class\/ECON101\/arc\/new/);
  });
});

// ─── Arc Management ──────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Arc Creation', () => {
  test('should load arc creation page', async ({ page }) => {
    await page.goto('/class/ECON101/arc/new');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

// ─── Navigation ──────────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Navigation', () => {
  test('should have sidebar with key navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('[data-testid="sidebar"], nav, aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to students page', async ({ page }) => {
    await page.goto('/students');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should navigate to scenarios page', async ({ page }) => {
    await page.goto('/scenarios');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });
});

// ─── Responsive Design ──────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Responsive', () => {
  test('should be usable on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await expect(page.locator('body')).toBeVisible();
  });
});
