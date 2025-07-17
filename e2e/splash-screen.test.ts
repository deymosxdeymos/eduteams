import { test, expect } from '@playwright/test';

test.describe('Welcome Splash Screen', () => {
  test('should show splash screen for new users after onboarding completion', async ({
    page,
  }) => {
    // Navigate to dashboard with firstVisit flag
    await page.goto('/dashboard?firstVisit=true');

    // Check if splash screen is visible - look for the specific splash screen element
    const splashScreen = page.locator(
      'div[class*="fixed inset-0"] h1:text("Selamat Datang")'
    );
    await expect(splashScreen).toBeVisible({ timeout: 5000 });

    // Wait for animation to complete
    await page.waitForTimeout(3000);

    // Verify splash screen has disappeared
    await expect(splashScreen).not.toBeVisible();

    // Verify URL was cleaned up
    expect(page.url()).toBe('http://localhost:3000/dashboard');
  });

  test('should not show splash screen for returning users', async ({
    page,
  }) => {
    // Navigate to dashboard without firstVisit flag
    await page.goto('/dashboard');

    // Check that splash screen is not visible
    const splashScreen = page.locator('div[class*="fixed inset-0"]');
    await expect(splashScreen).not.toBeVisible();
  });

  test('should not show splash screen when firstVisit=false', async ({
    page,
  }) => {
    await page.goto('/dashboard?firstVisit=false');

    // Check that splash screen is not visible
    const splashScreen = page.locator('div[class*="fixed inset-0"]');
    await expect(splashScreen).not.toBeVisible();
  });
});
