import { test, expect } from '@playwright/test';

test('debug splash screen', async ({ page }) => {
  console.log('Navigating to dashboard with firstVisit=true');
  await page.goto('/dashboard?firstVisit=true');

  // Take a screenshot to see what's on the page
  await page.screenshot({ path: 'debug-dashboard.png', fullPage: true });

  // Check all text content
  const allText = await page.textContent('body');
  console.log('All text on page:', allText);

  // Check for any h1 elements
  const h1Elements = await page.locator('h1').allTextContents();
  console.log('All h1 elements:', h1Elements);

  // Check for the specific splash screen
  const splashContainer = page.locator('div[class*="fixed inset-0"]');
  console.log('Splash container visible:', await splashContainer.isVisible());

  // Check for any element with "Selamat Datang"
  const selamatElements = page.locator('*:text("Selamat Datang")');
  console.log('Selamat Datang elements count:', await selamatElements.count());

  // List all divs with fixed positioning
  const fixedDivs = page.locator('div[class*="fixed"]');
  console.log('Fixed divs count:', await fixedDivs.count());

  await page.waitForTimeout(5000);
});
