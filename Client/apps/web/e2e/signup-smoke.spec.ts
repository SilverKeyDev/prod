import { expect, test } from "@playwright/test";

import { stubHealthAndGuestSession } from "./fixtures/stubApi";

test.describe("Signup (smoke, no account creation)", () => {
  test("loads the signup form", async ({ page }) => {
    // Title is in an h2 with logo; use visible text. Auth bootstrap must leave "checking" first.
    const slow = { timeout: 90_000 };
    await stubHealthAndGuestSession(page);
    await page.goto("/signup", { waitUntil: "load" });
    // Title shares the h2 with the logo; assert the form fields (stable a11y names).
    await expect(page.getByLabel("Full Name")).toBeVisible(slow);
    await expect(page.getByLabel("Email")).toBeVisible(slow);
    await expect(page.getByRole("textbox", { name: "Password" })).toBeVisible(slow);
  });
});
