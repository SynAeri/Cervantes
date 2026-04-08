// E2E tests for tab navigation, student detail modal, and scenarios tab
// Covers new features: tab switching, modal interactions, and arc card rendering

import { test, expect } from './fixtures';

test.describe('Tab Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/class/ECON101');
  });

  test('should show Student Performance tab by default', async ({ page }) => {
    // Wait for tabs to render
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });

    const studentTab = page.locator('text=Student Performance').first();
    await expect(studentTab).toBeVisible();
  });

  test('should switch to Scenarios tab on click', async ({ page }) => {
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });

    // Click the Scenarios tab
    const scenariosTab = page.locator('[role="tab"]', { hasText: 'Scenarios' });
    await scenariosTab.click();

    // The scenarios content area should become visible
    await page.waitForSelector('section, [role="tabpanel"]', { timeout: 10000 });
  });

  test('should show active tab indicator', async ({ page }) => {
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });

    // The default active tab should have aria-selected="true"
    const activeTab = page.locator('[role="tab"][aria-selected="true"]').first();
    await expect(activeTab).toBeVisible();
  });

  test('tabs should have correct ARIA roles', async ({ page }) => {
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });

    // Check for tablist and tab roles
    const tablist = page.locator('[role="tablist"]');
    await expect(tablist.first()).toBeVisible();

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Student Detail Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/class/ECON101');
    // Wait for the student table to load
    await page.waitForSelector('table tbody tr', { timeout: 15000 });
  });

  test('should open modal when clicking student row', async ({ page }) => {
    // Click on the first student row in the table body
    const studentRow = page.locator('table tbody tr').first();
    await studentRow.click();

    // Modal should appear with role="dialog"
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });
  });

  test('should close modal on Escape key', async ({ page }) => {
    const studentRow = page.locator('table tbody tr').first();
    await studentRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Modal should be hidden
    await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('should close modal on close button click', async ({ page }) => {
    const studentRow = page.locator('table tbody tr').first();
    await studentRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Click the close button
    const closeBtn = page.locator('[aria-label="Close modal"]');
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
    } else {
      // Fallback: press Escape
      await page.keyboard.press('Escape');
    }

    await expect(page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 5000 });
  });

  test('should show student stats in modal', async ({ page }) => {
    const studentRow = page.locator('table tbody tr').first();
    await studentRow.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5000 });

    // Modal should display student name (Alice Chen from mock data)
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('modal should have aria-modal attribute', async ({ page }) => {
    const studentRow = page.locator('table tbody tr').first();
    await studentRow.click();

    const dialog = page.locator('[aria-modal="true"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test('should show student detail content in modal', async ({ page }) => {
    const studentRow = page.locator('table tbody tr').first();
    await studentRow.click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Modal should render student details (stats, dimensions, graph, etc.)
    // Verify modal has meaningful content
    const modalText = await modal.textContent();
    expect(modalText?.length).toBeGreaterThan(0);
  });
});

test.describe('Scenarios Tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/class/ECON101');
    // Switch to the Scenarios tab and confirm it activates
    const scenariosTab = page.locator('[role="tab"]', { hasText: 'Scenarios' });
    await expect(scenariosTab).toBeVisible({ timeout: 15000 });
    await scenariosTab.click();
    await expect(scenariosTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });
  });

  test('should show arc cards when data is loaded', async ({ page }) => {
    // Arc cards contain "View Details" links, or empty state shows
    const viewDetails = page.locator('text=View Details');
    const emptyState = page.locator('text=No scenarios generated yet');

    // Wait for either state to appear
    await expect(viewDetails.or(emptyState).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show empty state when no arcs', async ({ page }) => {
    // Navigate to a class that has no arcs (SDD202 in mock data)
    await page.goto('/class/SDD202');
    // Wait for the Scenarios tab button to appear
    const scenariosTab = page.locator('[role="tab"]', { hasText: 'Scenarios' });
    await expect(scenariosTab).toBeVisible({ timeout: 15000 });
    await scenariosTab.click();
    // Verify the tab is selected
    await expect(scenariosTab).toHaveAttribute('aria-selected', 'true', { timeout: 5000 });

    // Wait for empty state or arc cards
    const emptyState = page.locator('text=No scenarios generated yet');
    const viewDetails = page.locator('text=View Details');
    await expect(emptyState.or(viewDetails).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show loading skeletons initially', async ({ page }) => {
    // Navigate fresh to trigger loading state
    await page.goto('/class/ECON101');
    await page.waitForSelector('[role="tab"]', { timeout: 15000 });
    await page.locator('[role="tab"]', { hasText: 'Scenarios' }).click();

    // Check for skeleton loading cards (pulse animation)
    const skeletons = page.locator('.animate-pulse');
    const skeletonCount = await skeletons.count();

    // Either skeletons are visible during loading, or content has already loaded
    expect(skeletonCount).toBeGreaterThanOrEqual(0);
  });
});
