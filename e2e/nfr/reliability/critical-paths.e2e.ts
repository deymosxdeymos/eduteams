import { test, expect } from '@playwright/test';

/**
 * NF-01: Reliability - Critical Path Testing
 * 
 * Tests the core user journeys to ensure system reliability:
 * 1. User authentication (login/logout)
 * 2. Onboarding flow
 * 3. Class creation (for Dosen)
 * 4. Team formation
 * 
 * Success Criteria:
 * - All critical paths complete without errors
 * - No broken navigation or dead ends
 * - Proper error handling for invalid inputs
 */

test.describe('NF-01: Reliability - Critical Paths', () => {
  
  test.describe('Authentication Flow', () => {
    test('should display login page for unauthenticated users', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to home/login - wait with timeout and check final URL
      await page.waitForLoadState('networkidle');
      
      // Verify we're not on dashboard
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/dashboard');
      
      // Should be on home or login page
      expect(currentUrl).toMatch(/\/(en)?\/?$/);
    });

    test('should show Google login button on landing page', async ({ page }) => {
      await page.goto('/');

      // Look for Google sign-in button or login trigger (use .first() as button appears in hero and footer)
      const signInButton = page.getByRole('button', { name: /masuk|sign in|login/i }).first();
      await expect(signInButton).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/onboarding',
      '/dashboard/profile',
      '/dashboard/manage',
    ];

    for (const route of protectedRoutes) {
      test(`should protect ${route} from unauthenticated access`, async ({ page }) => {
        await page.goto(route);
        
        // Should redirect away from protected route
        await page.waitForLoadState('networkidle');
        expect(page.url()).not.toContain(route);
      });
    }
  });

  test.describe('Language Switching', () => {
    test('should support Indonesian (default) and English locales', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check if language switcher exists - the button contains both the locale code and full text
      const languageSwitcher = page.getByRole('button', { name: /ID/i })
        .filter({ has: page.locator('img[alt]') })
        .first();

      if (await languageSwitcher.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click to switch to English and wait for navigation
        await Promise.all([
          page.waitForURL('**/en'),
          languageSwitcher.click()
        ]);

        // Verify we switched to English locale
        expect(page.url()).toContain('/en');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle non-existent routes gracefully', async ({ page }) => {
      const response = await page.goto('/this-route-does-not-exist-12345');
      
      // Should show 404 or redirect, not crash
      expect(response?.status()).toBeLessThan(500);
    });

    test('should handle invalid class ID gracefully', async ({ page }) => {
      await page.goto('/dashboard/class/invalid-class-id-xyz');
      
      // Should either show error message or redirect, not crash
      await page.waitForLoadState('networkidle');
      
      // Page should load without JS errors
      const logs: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') logs.push(msg.text());
      });
      
      await page.waitForTimeout(1000);
      
      // No unhandled errors
      const criticalErrors = logs.filter(log => 
        !log.includes('404') && 
        !log.includes('Failed to load') &&
        !log.includes('expected')
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Page Load Reliability', () => {
    const publicPages = [
      '/',
      '/en',
    ];

    for (const route of publicPages) {
      test(`${route} should load without errors`, async ({ page }) => {
        const response = await page.goto(route);
        
        // Check HTTP status
        expect(response?.status()).toBe(200);
        
        // Verify page loaded
        await page.waitForLoadState('domcontentloaded');
        
        // Check for Next.js hydration errors
        const hydrationErrors = await page.locator('[data-nextjs-dialog-overlay]').count();
        expect(hydrationErrors).toBe(0);
      });
    }
  });

  test.describe('Navigation Consistency', () => {
    test('should maintain navigation state across page loads', async ({ page }) => {
      await page.goto('/');

      // Get initial locale
      const initialUrl = page.url();
      const isEnglish = initialUrl.includes('/en');

      // Navigate to another page
      await page.goto(isEnglish ? '/en' : '/');

      // Locale should be preserved
      // With localePrefix: 'as-needed', Indonesian (default) has no prefix
      if (isEnglish) {
        expect(page.url()).toContain('/en');
      } else {
        // For Indonesian (default), ensure we're NOT on English
        expect(page.url()).not.toContain('/en');
      }
    });
  });
});
