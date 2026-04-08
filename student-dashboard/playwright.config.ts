// Playwright E2E test configuration for student dashboard

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'NEXT_PUBLIC_E2E_TEST=true npx next dev --webpack -p 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
