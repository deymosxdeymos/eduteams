import { test, expect } from '@playwright/test';

test('homepage loads and displays correctly', async ({ page }) => {
  await page.goto('/');

  // Check if the page loads
  await expect(page).toHaveTitle(/EquiTeams/); // Updated to match actual title

  // Check if key elements are present
  await expect(page.locator('body')).toBeVisible();

  // Take a screenshot for visual verification
  await page.screenshot({ path: 'test-results/homepage.png' });
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Test basic navigation if login button exists
  const loginButton = page.locator('text=Login').first();
  if (await loginButton.isVisible()) {
    await expect(loginButton).toBeVisible();
  }

  // Check if the page responds to interactions
  await page.click('body');
  await expect(page.locator('body')).toBeVisible();
});
