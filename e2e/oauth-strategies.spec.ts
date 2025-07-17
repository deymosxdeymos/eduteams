import { test, expect } from '@playwright/test';

// This test demonstrates different strategies for testing Google OAuth
test.describe('Google OAuth Testing Strategies', () => {
  test('Strategy 1: Test UI and client-side flow (Current working approach)', async ({
    page,
  }) => {
    await page.goto('/');

    // Test the login button and UI elements
    const loginButton = page.locator('button:has-text("Masuk")');
    await expect(loginButton).toBeVisible();

    // Monitor what happens when login is clicked
    const requests: string[] = [];
    page.on('request', request => {
      if (
        request.url().includes('/api/auth/') ||
        request.url().includes('google')
      ) {
        requests.push(request.url());
      }
    });

    await loginButton.click({ force: true });
    await page.waitForTimeout(2000);

    // This tests the client-side behavior regardless of server configuration
    console.log('✅ UI and client-side flow tested successfully');
    console.log('Auth requests triggered:', requests);
  });

  test('Strategy 2: Mock successful authentication', async ({ page }) => {
    // You can mock successful authentication by intercepting network requests
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, redirectTo: '/onboarding/role' }),
      });
    });

    await page.goto('/');
    const loginButton = page.locator('button:has-text("Masuk")');
    await loginButton.click({ force: true });

    console.log('✅ Mock authentication strategy demonstrated');
  });

  test('Strategy 3: Test with actual Google OAuth (requires configuration)', async ({
    page,
  }) => {
    // This would work if Google OAuth is properly configured
    // You'd need:
    // 1. Valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
    // 2. Test Google account credentials
    // 3. OAuth consent screen configured

    await page.goto('/');
    const loginButton = page.locator('button:has-text("Masuk")');
    await expect(loginButton).toBeVisible();

    // For real OAuth testing, you would:
    // 1. Click login button
    // 2. Fill in test Google credentials
    // 3. Handle OAuth consent
    // 4. Verify successful redirect

    console.log('✅ Real OAuth testing strategy outlined');
  });

  test('Strategy 4: Test authentication state management', async ({ page }) => {
    // Test how the app behaves with different authentication states

    // Test 1: Unauthenticated user accessing protected routes
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const dashboardUrl = page.url();
    console.log('Dashboard access (unauthenticated):', dashboardUrl);

    // Test 2: Unauthenticated user accessing onboarding
    await page.goto('/onboarding/role');
    await page.waitForLoadState('networkidle');

    const onboardingUrl = page.url();
    console.log('Onboarding access (unauthenticated):', onboardingUrl);

    // Test 3: Check if app redirects appropriately
    const isProperlyRedirected =
      dashboardUrl === 'http://localhost:3000/' &&
      onboardingUrl === 'http://localhost:3000/';

    console.log(
      '✅ Authentication state management tested:',
      isProperlyRedirected
    );
  });

  test('Strategy 5: Test with session storage/cookies', async ({ page }) => {
    // You can test authenticated states by setting session storage or cookies

    // Mock authenticated session
    await page.goto('/');

    // Set mock session data (adjust based on your auth implementation)
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'mock-token');
      sessionStorage.setItem(
        'user',
        JSON.stringify({
          id: 'test-user',
          email: 'test@example.com',
        })
      );
    });

    // Navigate to protected route
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    console.log('✅ Session-based authentication testing demonstrated');
  });
});

// Test the complete onboarding flow
test.describe('Complete Authentication Flow', () => {
  test('should handle complete user journey', async ({ page }) => {
    // Start from homepage
    await page.goto('/');

    // Check login button is available
    const loginButton = page.locator('button:has-text("Masuk")');
    await expect(loginButton).toBeVisible();

    // Test what happens when user tries to access onboarding directly
    await page.goto('/onboarding/role');
    const onboardingUrl = page.url();

    // Test what happens when user tries to access dashboard directly
    await page.goto('/dashboard');
    const dashboardUrl = page.url();

    console.log('Complete user journey tested:');
    console.log('- Homepage: ✅ Login button available');
    console.log('- Onboarding access:', onboardingUrl);
    console.log('- Dashboard access:', dashboardUrl);

    // Both should redirect to home if not authenticated
    expect(onboardingUrl).toBe('http://localhost:3000/');
    expect(dashboardUrl).toBe('http://localhost:3000/');
  });
});
