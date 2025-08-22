import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers and mobile devices */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile Testing */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'iPhone 13 Pro',
      use: { 
        ...devices['iPhone 13 Pro'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'iPhone 14 Pro Max',
      use: { 
        ...devices['iPhone 14 Pro Max'],
        viewport: { width: 414, height: 896 },
      },
    },
    {
      name: 'Galaxy S8+',
      use: { 
        ...devices['Galaxy S8+'],
        viewport: { width: 360, height: 780 },
      },
    },
    {
      name: 'iPad',
      use: { 
        ...devices['iPad Pro'],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Desktop Large',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 1366 },
      },
    },

    /* Test against mobile viewports with throttling */
    {
      name: 'Mobile Slow 3G',
      use: {
        ...devices['Pixel 5'],
        launchOptions: {
          args: ['--simulate-slow-connection'],
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
