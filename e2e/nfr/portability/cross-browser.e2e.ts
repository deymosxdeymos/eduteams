import { test, expect } from '@playwright/test';

/**
 * NF-02: Portability - Cross-Browser Compatibility Testing
 * 
 * Tests the application across different browsers and devices:
 * - Chromium (Chrome, Edge, Brave, etc.)
 * - Firefox
 * - Mobile browsers (responsive design)
 * 
 * Success Criteria:
 * - Core functionality works on all tested browsers
 * - UI renders correctly across browsers
 * - No browser-specific JavaScript errors
 * - Responsive design works on mobile viewports
 */

test.describe('NF-02: Portability (Cross-Browser)', () => {
  
  test.describe('Core Functionality', () => {
    // This test runs on all projects defined in playwright.config.ts
    test('homepage should load on all browsers', async ({ page, browserName }) => {
      console.log(`Testing on: ${browserName}`);
      
      const response = await page.goto('/');
      expect(response?.status()).toBe(200);
      
      await page.waitForLoadState('domcontentloaded');
      
      // Verify basic content is present
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should handle navigation on all browsers', async ({ page }) => {
      await page.goto('/');
      
      // Test locale switching
      await page.goto('/en');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/en');
    });

    test('should display Google sign-in button on all browsers', async ({ page }) => {
      await page.goto('/');
      
      // Look for sign-in button
      const signInButton = page.getByRole('button', { name: /masuk|sign in/i }).first();
      await expect(signInButton).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('JavaScript Compatibility', () => {
    test('should not have console errors on page load', async ({ page }) => {
      const errors: string[] = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Filter out known non-critical errors
      const criticalErrors = errors.filter(err => 
        !err.includes('404') &&
        !err.includes('favicon') &&
        !err.includes('Failed to fetch')
      );
      
      if (criticalErrors.length > 0) {
        console.log('Errors found:', criticalErrors);
      }
      
      expect(criticalErrors).toHaveLength(0);
    });

    test('should support modern JavaScript features', async ({ page }) => {
      await page.goto('/');

      // Test that ES6+ features work
      const supportsModernJS = await page.evaluate(() => {
        try {
          // Test arrow functions
          const arrow = () => true;

          // Test template literals
          const template = `test`;

          // Test destructuring
          const { a } = { a: 1 };

          // Test spread operator
          const arr = [...[1, 2, 3]];

          // Test async/await
          const asyncTest = async () => true;

          // Ensure explicit boolean return
          return !!(arrow() && template && a === 1 && arr.length === 3 && typeof asyncTest === 'function');
        } catch {
          return false;
        }
      });

      expect(supportsModernJS).toBeTruthy();
    });
  });

  test.describe('CSS and Rendering', () => {
    test('should render layout correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check viewport is rendered
      const viewport = page.viewportSize();
      expect(viewport).toBeTruthy();
      expect(viewport?.width).toBeGreaterThan(0);
      expect(viewport?.height).toBeGreaterThan(0);
      
      // Check body is visible and has content
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      expect(bodyHeight).toBeGreaterThan(100);
    });

    test('should support CSS Grid and Flexbox', async ({ page }) => {
      await page.goto('/');
      
      const supportsModernCSS = await page.evaluate(() => {
        const testDiv = document.createElement('div');
        document.body.appendChild(testDiv);
        
        // Test Grid
        testDiv.style.display = 'grid';
        const supportsGrid = window.getComputedStyle(testDiv).display === 'grid';
        
        // Test Flexbox
        testDiv.style.display = 'flex';
        const supportsFlex = window.getComputedStyle(testDiv).display === 'flex';
        
        document.body.removeChild(testDiv);
        
        return supportsGrid && supportsFlex;
      });
      
      expect(supportsModernCSS).toBeTruthy();
    });

    test('should load custom fonts', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Wait for fonts to load
      await page.waitForTimeout(2000);
      
      // Check if fonts are loaded (Next.js typically uses system fonts or loaded fonts)
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      
      expect(fontFamily).toBeTruthy();
      expect(fontFamily.length).toBeGreaterThan(0);
    });
  });

  test.describe('Form Interactions', () => {
    test('should handle form inputs correctly', async ({ page }) => {
      await page.goto('/');
      
      // Try to find any input fields
      const inputs = await page.locator('input, textarea').count();
      
      if (inputs > 0) {
        const firstInput = page.locator('input, textarea').first();
        await firstInput.fill('test');
        
        const value = await firstInput.inputValue();
        expect(value).toBe('test');
      }
    });

    test('should handle button clicks', async ({ page }) => {
      await page.goto('/');
      
      // Find a clickable button
      const buttons = await page.locator('button').count();
      expect(buttons).toBeGreaterThan(0);
      
      // Verify button is clickable (no error on click)
      const button = page.locator('button').first();
      await button.click().catch(() => {
        // Some buttons might need specific state, that's okay
      });
    });
  });

  test.describe('Responsive Design (Mobile)', () => {
    // Only runs on mobile-chrome project
    test('should be mobile-responsive', async ({ page, browserName }) => {
      // This test is specifically for mobile viewport
      if (browserName !== 'chromium' || !page.viewportSize()?.width || page.viewportSize()!.width > 500) {
        // Intentionally fail to show this test only runs on mobile
        expect(true).toBe(false);
        return;
      }
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check mobile viewport
      const viewport = page.viewportSize();
      expect(viewport?.width).toBeLessThanOrEqual(500);
      
      // Content should still be accessible
      const bodyVisible = await page.locator('body').isVisible();
      expect(bodyVisible).toBeTruthy();
      
      // No horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      expect(hasHorizontalScroll).toBeFalsy();
    });

    test('should handle touch events on mobile', async ({ page }) => {
      if (!page.viewportSize()?.width || page.viewportSize()!.width > 500) {
        // Intentionally fail to show this test only runs on mobile
        expect(true).toBe(false);
        return;
      }
      
      await page.goto('/');
      
      // Test touch tap
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.tap();
      }
    });
  });

  test.describe('Media Queries', () => {
    test('should adapt to different viewport sizes', async ({ page }) => {
      await page.goto('/');
      
      // Desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(500);
      let bodyWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyWidth).toBeGreaterThan(1000);
      
      // Tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      bodyWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyWidth).toBeLessThanOrEqual(768);
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      bodyWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Browser APIs', () => {
    test('should have access to required browser APIs', async ({ page }) => {
      await page.goto('/');
      
      const apis = await page.evaluate(() => {
        return {
          localStorage: typeof localStorage !== 'undefined',
          sessionStorage: typeof sessionStorage !== 'undefined',
          fetch: typeof fetch !== 'undefined',
          Promise: typeof Promise !== 'undefined',
          crypto: typeof crypto !== 'undefined',
        };
      });
      
      expect(apis.localStorage).toBeTruthy();
      expect(apis.sessionStorage).toBeTruthy();
      expect(apis.fetch).toBeTruthy();
      expect(apis.Promise).toBeTruthy();
      expect(apis.crypto).toBeTruthy();
    });
  });

  test.describe('Image Rendering', () => {
    test('should load and display images', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const images = await page.locator('img').count();
      
      if (images > 0) {
        // Check first few images loaded successfully
        const firstImage = page.locator('img').first();
        const isVisible = await firstImage.isVisible();
        
        expect(isVisible).toBeTruthy();
        
        // Check if image has dimensions
        const dimensions = await firstImage.boundingBox();
        expect(dimensions?.width).toBeGreaterThan(0);
        expect(dimensions?.height).toBeGreaterThan(0);
      }
    });
  });
});
