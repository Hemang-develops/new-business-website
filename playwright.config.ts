import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e/tests',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    headless: true,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
