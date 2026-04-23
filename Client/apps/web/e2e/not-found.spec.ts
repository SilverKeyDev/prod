import { expect, test } from "@playwright/test";

import { stubHealthAndGuestSession } from "./fixtures/stubApi";

test.describe("404 Not found page", () => {
  test("shows help copy and link to home", async ({ page }) => {
    // Auth bootstrap can take several seconds (session verify + retries) on cold start.
    const slow = { timeout: 90_000 };
    await stubHealthAndGuestSession(page);
    await page.goto("/this-route-does-not-exist-qa", { waitUntil: "load" });
    await expect(page.getByText("Page not found", { exact: true })).toBeVisible(slow);
    await expect(
      page.getByText("The page you’re looking for doesn’t exist or has been moved.")
    ).toBeVisible(slow);
    await expect(page.getByRole("link", { name: /go to home/i })).toBeVisible(slow);
  });
});
