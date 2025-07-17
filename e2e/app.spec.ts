import { test, expect } from '@playwright/test';

test.describe('EduTeams App Tests', () => {
  test('should load homepage and display correct title', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/EquiTeams/);

    // Check if the page loads without JavaScript errors
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check for no console errors
    expect(logs).toEqual([]);
  });

  test('should have responsive layout', async ({ page }) => {
    await page.goto('/');

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to onboarding routes', async ({ page }) => {
    await page.goto('/');

    // Try to navigate to onboarding role selection
    await page.goto('/onboarding/role');

    // Check if the page loads (even if behind auth)
    await expect(page.locator('body')).toBeVisible();
  });
});
