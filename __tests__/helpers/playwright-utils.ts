import type { Page } from '@playwright/test';

/**
 * Test helpers for E2E and NFR tests
 */

/**
 * Creates a mock authentication session for testing
 * Note: This requires the app to support test mode or mock auth
 */
export async function setupTestAuth(_page: Page, role: 'dosen' | 'mahasiswa' = 'mahasiswa') {
  // In a real implementation, this would:
  // 1. Create a test user in the database
  // 2. Generate a valid session token
  // 3. Set the cookie
  
  // For now, we'll document the structure needed
  // This is a placeholder that will need backend support
  console.log(`TODO: Implement test auth setup for role: ${role}`);
}

/**
 * Fills out the onboarding form
 */
export async function completeOnboarding(page: Page, userData: {
  role: 'dosen' | 'mahasiswa';
  name: string;
  nim?: string;
  gender?: 'male' | 'female';
}) {
  // Navigate to onboarding
  await page.goto('/onboarding/role');
  
  // Select role
  await page.getByRole('button', { name: new RegExp(userData.role, 'i') }).click();
  
  // Fill personal data
  await page.fill('[name="name"]', userData.name);
  if (userData.nim) {
    await page.fill('[name="nim"]', userData.nim);
  }
  
  // Continue through onboarding steps
  await page.getByRole('button', { name: /lanjut|continue|next/i }).click();
}

/**
 * Waits for navigation to complete and returns the new URL
 */
export async function waitForNavigation(page: Page): Promise<string> {
  await page.waitForLoadState('networkidle');
  return page.url();
}

/**
 * Takes a screenshot with a descriptive name
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `.playwright-report/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Checks if element is visible within timeout
 */
export async function isVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}
