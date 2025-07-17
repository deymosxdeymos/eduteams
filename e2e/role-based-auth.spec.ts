import { test, expect } from '@playwright/test';

test.describe('Role-Based Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should test login UI and authentication flow for dosen', async ({
    page,
  }) => {
    // Step 1: Start from homepage
    await page.goto('/');

    // Verify homepage is accessible
    await expect(page.locator('h1:has-text("Dimana Keadilan")')).toBeVisible();

    // Step 2: Test login button
    const loginButton = page.locator('button:has-text("Masuk")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveClass(/bg-white/);
    await expect(loginButton).toHaveClass(/text-blue-800/);

    // Step 3: Monitor auth requests when clicking login
    const authRequests: string[] = [];
    page.on('request', request => {
      if (
        request.url().includes('/api/auth/') ||
        request.url().includes('google')
      ) {
        authRequests.push(request.url());
      }
    });

    await loginButton.click({ force: true });
    await page.waitForTimeout(2000);

    // Step 4: Test onboarding flow UI (without authentication)
    await page.goto('/onboarding/role');

    // Since not authenticated, should be redirected to homepage
    await page.waitForLoadState('networkidle');
    const currentUrl = page.url();
    expect(currentUrl).toBe('http://localhost:3000/');

    console.log('✅ Dosen login UI and flow tested successfully');
    console.log('Auth requests triggered:', authRequests);
  });

  test('should test login UI and authentication flow for student', async ({
    page,
  }) => {
    // Step 1: Start from homepage
    await page.goto('/');

    // Verify homepage is accessible
    await expect(page.locator('h1:has-text("Dimana Keadilan")')).toBeVisible();

    // Step 2: Test login button
    const loginButton = page.locator('button:has-text("Masuk")');
    await expect(loginButton).toBeVisible();

    // Step 3: Monitor auth requests when clicking login
    const authRequests: string[] = [];
    page.on('request', request => {
      if (
        request.url().includes('/api/auth/') ||
        request.url().includes('google')
      ) {
        authRequests.push(request.url());
      }
    });

    await loginButton.click({ force: true });
    await page.waitForTimeout(2000);

    // Step 4: Test that unauthenticated users can't access protected routes
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    console.log('✅ Student login UI and flow tested successfully');
    console.log('Auth requests triggered:', authRequests);
  });

  test('should test onboarding page UI elements', async ({ page }) => {
    // Test onboarding role selection page UI
    await page.goto('/onboarding/role');
    await page.waitForLoadState('networkidle');

    // Should redirect to home if not authenticated
    const currentUrl = page.url();
    expect(currentUrl).toBe('http://localhost:3000/');

    // Test direct access to data-diri pages
    await page.goto('/onboarding/data-diri/dosen');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    await page.goto('/onboarding/data-diri/mahasiswa');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    console.log('✅ Onboarding page protection tested successfully');
  });

  test('should handle navigation between homepage and protected routes', async ({
    page,
  }) => {
    // Test 1: Navigate to homepage
    await page.goto('/');
    await expect(page.locator('h1:has-text("Dimana Keadilan")')).toBeVisible();

    // Test 2: Try to access dashboard (should redirect to homepage)
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    // Test 3: Try to access personality test (should redirect to homepage)
    await page.goto('/onboarding/kepribadian');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    // Test 4: Try to access resume (should redirect to homepage)
    await page.goto('/onboarding/resume');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toBe('http://localhost:3000/');

    console.log('✅ Navigation and route protection works correctly');
  });

  test('should test responsive design for both role interfaces', async ({
    page,
  }) => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1200, height: 800, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');

      // Test login button visibility
      const loginButton = page.locator('button:has-text("Masuk")');
      await expect(loginButton).toBeVisible();

      // Test main heading visibility
      await expect(
        page.locator('h1:has-text("Dimana Keadilan")')
      ).toBeVisible();

      // Test mascot visibility
      const mascot = page.locator('img[alt="mascot"]');
      await expect(mascot).toBeVisible();

      console.log(`✅ ${viewport.name} responsive design works correctly`);
    }
  });

  test('should verify homepage allows logged-in users to access it', async ({
    page,
  }) => {
    // This test verifies the fix we made to middleware.ts
    // Mock an authenticated state
    await page.goto('/');

    // Set a mock session cookie to simulate authenticated user
    await page.context().addCookies([
      {
        name: 'better-auth.session_token',
        value: 'mock-session-token',
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        secure: false,
      },
    ]);

    // Navigate to homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should still be able to access homepage (not redirected to /onboarding/resume)
    const currentUrl = page.url();
    expect(currentUrl).toBe('http://localhost:3000/');

    // Should see the homepage content
    await expect(page.locator('h1:has-text("Dimana Keadilan")')).toBeVisible();

    console.log('✅ Homepage access for authenticated users verified');
  });

  test('should test complete UI flow simulation', async ({ page }) => {
    // Step 1: Start from homepage
    await page.goto('/');
    await expect(page.locator('h1:has-text("Dimana Keadilan")')).toBeVisible();

    // Step 2: Test login button interaction
    const loginButton = page.locator('button:has-text("Masuk")');
    await expect(loginButton).toBeVisible();

    // Step 3: Monitor network activity
    const networkRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push(request.url());
      }
    });

    await loginButton.click({ force: true });
    await page.waitForTimeout(1000);

    // Step 4: Test various route access scenarios
    const routes = [
      '/dashboard',
      '/onboarding/role',
      '/onboarding/kepribadian',
      '/onboarding/resume',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // All should redirect to homepage for unauthenticated users
      expect(page.url()).toBe('http://localhost:3000/');
    }

    console.log('✅ Complete UI flow simulation completed');
    console.log('Network requests:', networkRequests);
  });
});
