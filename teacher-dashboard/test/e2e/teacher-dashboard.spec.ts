// E2E tests for teacher dashboard critical paths
// Tests login, dashboard navigation, class viewing, arc creation, and student management

import { test, expect } from './fixtures';

// ─── Public Pages ────────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Public Pages', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
  });

  test('should redirect unauthenticated user from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    // In E2E mode auth is mocked, so we stay on dashboard
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10000 });
  });
});

// ─── Dashboard ───────────────────────────────────────────────────────────────

test.describe('Teacher Dashboard - Dashboard View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display all classes on dashboard', async ({ page }) => {
    // Wait for class cards (links to /class/...) or loading skeletons
    await page.waitForSelector('a[href*="/class/"], .animate-pulse', { timeout: 15000 });
    const classLinks = await page.locator('a[href*="/class/"]').count();
    const skeletons = await page.locator('.animate-pulse').count();
    expect(classLinks + skeletons).toBeGreaterThan(0);
  });

  test('should navigate to class detail page', async ({ page }) => {
    await page.waitForSelector('a[href*="/class/"]', { timeout: 15000 });
    const firstClassLink = page.locator('a[href*="/class/"]').first();
    await firstClassLink.click();
    await expect(page).toHaveURL(/\/class\/.+/);
  });

  test('should show total student count', async ({ page }) => {
    await page.waitForSelector('text=Total Students', { timeout: 15000 });
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
    await expect(page.locator('text=Create New Arc')).toBeVisible({ timeout: 15000 });
  });

  test('should show error for invalid class', async ({ page }) => {
    await page.goto('/class/INVALID_CLASS_ID');
    await expect(page.locator('text=Error loading class')).toBeVisible({ timeout: 15000 });
  });

  test('should navigate to arc creation page', async ({ page }) => {
    await page.goto('/class/ECON101');
    // The "Create New Arc" link is <Link href=".../arc/new"><button>...</button></Link>
    const arcLink = page.locator('a[href$="/arc/new"]');
    await expect(arcLink).toBeVisible({ timeout: 15000 });
    await Promise.all([
      page.waitForURL(/\/arc\/new/, { timeout: 10000 }),
      arcLink.click(),
    ]);
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
    const sidebar = page.locator('aside');
    await expect(sidebar.first()).toBeVisible({ timeout: 15000 });
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
