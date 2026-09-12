import { defineConfig } from "@playwright/test";

/** Run browser regressions against an isolated production server. */
export default defineConfig({
  testDir: "./tests",
  forbidOnly: true,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3101",
    browserName: "chromium",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm start --port 3101 --hostname 127.0.0.1",
    url: "http://127.0.0.1:3101",
    reuseExistingServer: false,
  },
});
