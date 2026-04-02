import { test as setup, expect } from '@playwright/test';

// This setup file authenticates a test user for all E2E tests
setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');
  
  // In a real app, you would:
  // 1. Fill in credentials
  // 2. Submit the form
  // 3. Wait for redirect
  // For demo purposes, we'll use a workaround
  
  // Mock authentication by setting localStorage
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('sb-access-token', 'mock-token');
    localStorage.setItem('sb-user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: { tenant_id: 'test-tenant' }
    }));
  });
  
  // Verify we're authenticated
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
});
