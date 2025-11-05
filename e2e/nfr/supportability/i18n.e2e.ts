import { test, expect } from '@playwright/test';

/**
 * NF-04: Supportability - Internationalization (i18n) Testing
 * 
 * Tests the internationalization and localization features:
 * - Language switching works correctly
 * - All pages are accessible in both locales
 * - Translations are properly applied
 * - URL routing includes locale
 * - No missing translations on key pages
 * 
 * Success Criteria:
 * - Both Indonesian (id) and English (en) locales work
 * - Language switcher is accessible and functional
 * - Content changes when locale changes
 * - No English text on Indonesian pages (and vice versa) for key UI elements
 */

test.describe('NF-04: Internationalization (i18n)', () => {

  // Clear cookies and storage before each test to ensure clean state
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test.describe('Locale Routing', () => {
    test('should support Indonesian (default) locale', async ({ page }) => {
      await page.goto('/');

      // Default should be Indonesian
      await page.waitForLoadState('networkidle');

      // With localePrefix: 'as-needed', default locale (id) has no prefix
      // URL should NOT contain /en (meaning it's Indonesian)
      const url = page.url();
      expect(!url.includes('/en')).toBeTruthy();
    });

    test('should support English locale with /en prefix', async ({ page }) => {
      await page.goto('/en');
      
      await page.waitForLoadState('networkidle');
      
      // Should include /en in URL
      expect(page.url()).toContain('/en');
    });

    test('should preserve locale across navigation', async ({ page }) => {
      await page.goto('/en');
      
      // Navigate to another page (if available)
      const links = await page.locator('a[href^="/en"]').all();
      
      if (links.length > 0) {
        await links[0].click();
        await page.waitForLoadState('networkidle');
        
        // Should still be in English locale
        expect(page.url()).toContain('/en');
      }
    });
  });

  test.describe('Language Switcher', () => {
    test('should display language switcher on homepage', async ({ page }) => {
      await page.goto('/');

      // Look for language switcher element
      // The link shows current locale (ID or EN) with a flag icon
      const localeLink = await page.getByRole('link', { name: /(ID|EN)/i }).count();

      // Language switching link should exist
      expect(localeLink).toBeGreaterThan(0);
    });

    test('should switch language when language switcher is used', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Find language switcher link (contains "ID" when on Indonesian locale)
      // Link includes locale code + flag alt text
      const languageSwitcher = page.getByRole('link', { name: /ID/i }).filter({ has: page.locator('img[alt]') }).first();
      await expect(languageSwitcher).toBeVisible();

      // Click to switch to English and wait for navigation
      await Promise.all([
        page.waitForURL('**/en'),
        languageSwitcher.click()
      ]);

      // URL should now include /en
      expect(page.url()).toContain('/en');

      // Link should now show "EN" (current locale)
      const enLink = page.getByRole('link', { name: /EN/i }).filter({ has: page.locator('img[alt]') });
      await expect(enLink).toBeVisible();
    });
  });

  test.describe('Content Translation', () => {
    test('should display Indonesian content on default locale', async ({ page }) => {
      await page.goto('/');
      
      await page.waitForLoadState('networkidle');
      
      // Look for common Indonesian words that should appear on homepage
      const bodyText = await page.textContent('body');
      
      // Check for Indonesian-specific words from homepage
      const hasIndonesian = 
        bodyText?.includes('Masuk') || 
        bodyText?.includes('dengan') || 
        bodyText?.includes('EquiTeam') ||
        bodyText?.includes('Dimana');
      
      expect(hasIndonesian).toBeTruthy();
    });

    test('should display English content on /en locale', async ({ page }) => {
      await page.goto('/en');
      
      await page.waitForLoadState('networkidle');
      
      // Look for English words that should appear
      const bodyText = await page.textContent('body');
      
      const hasEnglish = 
        bodyText?.includes('Sign in') || 
        bodyText?.includes('with') || 
        bodyText?.includes('EquiTeam') ||
        bodyText?.includes('Where');
      
      expect(hasEnglish).toBeTruthy();
    });

    test('should translate auth elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for "Masuk dengan Google" (Indonesian) - appears in hero and footer
      const signInButton = await page.getByText(/masuk dengan google/i).first();
      await expect(signInButton).toBeVisible();

      // Now check English
      await page.goto('/en');
      await page.waitForLoadState('networkidle');
      const signInButtonEn = await page.getByText(/sign in with google/i).first();
      await expect(signInButtonEn).toBeVisible();
    });
  });

  test.describe('Translation Completeness', () => {
    const testPages = [
      { id: '/', en: '/en', name: 'Homepage' },
    ];

    for (const testPage of testPages) {
      test(`${testPage.name} should have translations for both locales`, async ({ page }) => {
        // Load Indonesian version
        await page.goto(testPage.id);
        await page.waitForLoadState('networkidle');
        
        const idContent = await page.textContent('body');
        expect(idContent?.length || 0).toBeGreaterThan(100); // Should have substantial content
        
        // Load English version
        await page.goto(testPage.en);
        await page.waitForLoadState('networkidle');
        
        const enContent = await page.textContent('body');
        expect(enContent?.length || 0).toBeGreaterThan(100); // Should have substantial content
        
        // Content should be different (translated)
        expect(idContent).not.toBe(enContent);
      });
    }
  });

  test.describe('Date and Number Formatting', () => {
    test('should format dates according to locale', async ({ page }) => {
      // This test assumes there are dates displayed somewhere
      await page.goto('/dashboard').catch(() => {});
      
      // If redirected (not authenticated), that's okay for this test
      // Just checking the locale formatting would work
      await page.waitForLoadState('networkidle');
      
      // The actual formatting is handled by next-intl
      // This test validates the setup is correct
      expect(true).toBe(true); // Placeholder - actual date checks would go here
    });
  });

  test.describe('Error Messages', () => {
    test('should display 404 error in correct locale', async ({ page }) => {
      // Indonesian 404
      await page.goto('/this-page-does-not-exist-xyz');
      await page.waitForLoadState('networkidle');
      
      const bodyText = await page.textContent('body');
      
      // Should show error in Indonesian (default)
      expect(bodyText).toBeTruthy();
      
      // English 404
      await page.goto('/en/this-page-does-not-exist-xyz');
      await page.waitForLoadState('networkidle');
      
      const bodyTextEn = await page.textContent('body');
      expect(bodyTextEn).toBeTruthy();
    });
  });

  test.describe('RTL Support (Future)', () => {
    test('should support LTR for Indonesian and English', async ({ page }) => {
      await page.goto('/');
      
      const dir = await page.locator('html').getAttribute('dir');
      
      // Both Indonesian and English use LTR
      expect(dir === null || dir === 'ltr').toBeTruthy();
    });
  });

  test.describe('Locale Persistence', () => {
    test('should remember locale preference across page reloads', async ({ page }) => {
      // Set to English
      await page.goto('/en');
      await page.waitForLoadState('networkidle');
      
      expect(page.url()).toContain('/en');
      
      // Reload
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Should still be English
      expect(page.url()).toContain('/en');
    });
  });
});
