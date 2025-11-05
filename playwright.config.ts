import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: ['**/*.e2e.ts'],

  /* Build production bundle before running tests */
  globalSetup: './playwright-global-setup.ts',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: '.playwright-report', open: 'never' }],
    ['json', { outputFile: '.playwright-report/results.json' }],
    ['list'],
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'retain-on-failure',

    /* Set locale to Indonesian by default for testing */
    locale: 'id-ID',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Force light mode for consistent screenshots
        colorScheme: 'light',
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        colorScheme: 'light',
      },
    },

    // Mobile viewports for responsive testing
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        colorScheme: 'light',
      },
    },
  ],

  webServer: {
    // Use production build for accurate performance metrics
    // Build is done in globalSetup or manually before running tests
    command: 'bun run start',
    url: process.env.BASE_URL || 'http://localhost:3000',
    reuseExistingServer: true,
    env: {
      ...process.env,
      AGENT: process.env.AGENT ?? '1',
    },
  },
});
