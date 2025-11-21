import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  timeout: 120_000,
  fullyParallel: false,
  retries: 0,
  use: {
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    trace: 'off'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});

