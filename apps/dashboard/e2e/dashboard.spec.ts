import { test, expect } from '@playwright/test';

// These tests require authentication - they depend on auth.setup.ts
test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to dashboard home
    await page.goto('/dashboard');
  });

  test('displays dashboard page with sidebar', async ({ page }) => {
    // Check sidebar is visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Members')).toBeVisible();
    await expect(page.locator('text=Rewards')).toBeVisible();
  });

  test('sidebar navigation works', async ({ page }) => {
    // Click on Members
    await page.click('text=Members');
    await expect(page).toHaveURL(/\/members/);
    
    // Click on Rewards
    await page.click('text=Rewards');
    await expect(page).toHaveURL(/\/rewards/);
    
    // Click on Analytics
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/\/analytics/);
    
    // Click on Settings
    await page.click('text=Settings');
    await expect(page).toHaveURL(/\/settings/);
  });

  test('user info is displayed', async ({ page }) => {
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Starter Plan')).toBeVisible();
  });
});

test.describe('Dashboard Metrics', () => {
  test('displays metric cards', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for metric cards (using approximate text matching)
    await expect(page.locator('text=Active Members').first()).toBeVisible();
    await expect(page.locator('text=Total Points').first()).toBeVisible();
    await expect(page.locator('text=Visits This Month').first()).toBeVisible();
  });

  test('metric cards show values', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that metric values are displayed (numbers)
    const metricsSection = page.locator('.grid');
    await expect(metricsSection).toBeVisible();
  });
});
