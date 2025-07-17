import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // Give Google OAuth more time
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          executablePath:
            '/home/deymos/.cache/ms-playwright/chromium-1181/chrome-linux/chrome',
          // Allow Google OAuth redirects
          args: ['--disable-web-security', '--allow-running-insecure-content'],
        },
      },
    },
  ],
  webServer: {
    command: 'echo "Using existing tmux session for dev server"',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
