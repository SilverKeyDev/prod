import type { Page } from "@playwright/test";

/** Avoid maintenance mode: failed /healthz sets maintenance in useHealthCheck. */
export async function stubHealthOk(page: Page): Promise<void> {
  await page.route("**/healthz", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok" }),
    });
  });
}

/**
 * Guest session: no user. Dev server proxies /api to Flask; without a backend, stub profile + refresh.
 * Call before `page.goto` so the app leaves the loading shimmer.
 */
export async function stubHealthAndGuestSession(page: Page): Promise<void> {
  await stubHealthOk(page);

  await page.route("**/api/v1/user/profile", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: "{}",
    });
  });

  await page.route("**/api/v1/auth/refresh-token", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: "REFRESH_TOKEN_INVALID",
      }),
    });
  });
}
