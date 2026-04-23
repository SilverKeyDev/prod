import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, devices } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = __dirname;
const isCi = process.env.CI === "true" || process.env.CI === "1";

const baseURL = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/+$/, "") ?? "http://127.0.0.1:5173";

const startLocalVite = !process.env.PLAYWRIGHT_BASE_URL;

/**
 * E2E runs against the Vite dev server by default. Set `PLAYWRIGHT_BASE_URL` to
 * a full URL (e.g. staging) to skip the local `webServer` and target that base only.
 * Install browsers: `pnpm exec playwright install` (from apps/web or Client).
 */
export default defineConfig({
  testDir: path.join(appDir, "e2e"),
  /* Session verify can include retries; stubs keep this short, but allow headroom. */
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 2 : undefined,
  reporter: isCi ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    /* Align with app HTTP timeout + retries in development. */
    actionTimeout: 30_000,
    navigationTimeout: 45_000,
  },
  expect: {
    timeout: 45_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  ...(startLocalVite
    ? {
        webServer: {
          command: "pnpm dev",
          cwd: appDir,
          url: baseURL,
          reuseExistingServer: !isCi,
          timeout: 120_000,
        },
      }
    : {}),
});
