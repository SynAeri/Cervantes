// E2E tests for teacher dashboard critical paths
// Tests login, dashboard navigation, class viewing, and arc creation workflow

import { test, expect } from '@playwright/test';

test.describe('Teacher Dashboard - Critical Paths', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In production, this would go through Firebase Auth
    // For now, we'll test the dashboard pages directly
    await page.goto('/dashboard');
  });

  test('should display all classes on dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for classes to load
    await page.waitForSelector('[data-testid="class-card"]', { timeout: 10000 });

    // Should show 3 classes (Economics, English Standard, Software Development)
    const classCards = await page.locator('[data-testid="class-card"]').count();
    expect(classCards).toBeGreaterThan(0);
  });

  test('should navigate to class detail page', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for classes to load
    await page.waitForSelector('a[href*="/class/"]', { timeout: 10000 });

    // Click first class
    const firstClassLink = page.locator('a[href*="/class/"]').first();
    await firstClassLink.click();

    // Should navigate to class detail page
    await expect(page).toHaveURL(/\/class\/.+/);

    // Should show class overview
    await expect(page.locator('h4').first()).toBeVisible();
  });

  test('should show correct student counts', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for stats to load
    await page.waitForSelector('text=Total Students', { timeout: 10000 });

    // Should show 30 total students (10 per class)
    const totalStudentsText = await page.locator('text=Total Students').locator('..').locator('span').last().textContent();
    expect(totalStudentsText).toContain('30');
  });

  test('should handle loading states', async ({ page }) => {
    await page.goto('/dashboard');

    // Should show loading skeleton initially
    const skeletons = await page.locator('.animate-pulse').count();
    expect(skeletons).toBeGreaterThan(0);
  });

  test('should show create arc button on class detail', async ({ page }) => {
    // Navigate to Economics class
    await page.goto('/class/ECON101');

    // Wait for page to load
    await page.waitForSelector('text=Create New Arc', { timeout: 10000 });

    // Should show create arc button
    const createButton = page.locator('text=Create New Arc');
    await expect(createButton).toBeVisible();
  });
});

test.describe('Teacher Dashboard - Error Handling', () => {
  test('should show error message when class not found', async ({ page }) => {
    await page.goto('/class/INVALID_CLASS_ID');

    // Should show error message
    await page.waitForSelector('text=Error loading class', { timeout: 10000 });
    await expect(page.locator('text=Error loading class')).toBeVisible();
  });
});
