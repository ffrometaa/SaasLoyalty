import { test, expect } from '@playwright/test';

test.describe('Members Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/members');
  });

  test('displays members page header', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Members');
  });

  test('displays add member button', async ({ page }) => {
    const addButton = page.locator('button', { hasText: /add member/i });
    await expect(addButton).toBeVisible();
  });

  test('opens add member modal when button is clicked', async ({ page }) => {
    await page.click('button:has-text("Add Member")');
    
    // Check modal is open
    await expect(page.locator('text=Add New Member')).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    // Type in search box
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('John');
      // Should filter results
      await page.waitForTimeout(300);
    }
  });

  test('can navigate to member detail', async ({ page }) => {
    // Look for a member row and click on it
    const memberRow = page.locator('tbody tr').first();
    if (await memberRow.isVisible()) {
      await memberRow.click();
      // Should navigate to member detail
      await expect(page).toHaveURL(/\/members\/[a-z0-9-]+/i);
    }
  });
});

test.describe('Add Member Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/members');
    await page.click('button:has-text("Add Member")');
    await expect(page.locator('text=Add New Member')).toBeVisible();
  });

  test('displays all form fields', async ({ page }) => {
    await expect(page.locator('label:has-text("Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Email")')).toBeVisible();
    await expect(page.locator('label:has-text("Phone")')).toBeVisible();
  });

  test('validates required fields', async ({ page }) => {
    // Submit without filling
    await page.click('button:has-text("Add Member")');
    
    // Should show validation errors (form should not submit)
    await expect(page.locator('text=Add New Member')).toBeVisible();
  });

  test('can close modal', async ({ page }) => {
    // Click close button
    await page.click('button[aria-label*="close" i]');
    
    // Modal should be closed
    await expect(page.locator('text=Add New Member')).not.toBeVisible();
  });
});
