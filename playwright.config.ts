import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const CI = !!process.env.CI;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  // The production build, served the way it ships.
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 240_000
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone-safari', use: { ...devices['iPhone 13'] } },
    {
      name: 'android-chrome',
      // At 2x the canvas has 1.5x desktop's pixels, and software WebGL on CI runners draws it
      // slowly enough to time out clicks. Layout, touch and mobile emulation are unchanged at 1x.
      use: { ...devices['Pixel 7'], deviceScaleFactor: 1 }
    },
    { name: 'iphone-landscape', use: { ...devices['iPhone 13 landscape'] } }
  ]
});
