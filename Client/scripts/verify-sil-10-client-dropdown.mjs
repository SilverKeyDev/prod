/**
 * One-off SIL-10 verification: agent library client dropdown on mobile viewport.
 * Usage: PARITY_BASE_URL=http://localhost:5173 node scripts/verify-sil-10-client-dropdown.mjs
 */
import fs from "node:fs";
import path from "node:path";

import { chromium } from "playwright";

const CLIENT_ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(CLIENT_ROOT, ".visual-parity", "sil-10");
const BASE_URL = process.env.PARITY_BASE_URL ?? "http://localhost:5173";
const API_BASE = process.env.API_BASE_URL ?? "https://api.usesilverkey.com";

const AGENT_EMAIL = "silverkeyqa+agent@gmail.com";
const AGENT_PASSWORD = "SilverKeyQA!2026";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  ensureDir(OUT_DIR);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  try {
    // Prefer API login so we do not depend on UI timing.
    const loginRes = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: AGENT_EMAIL, password: AGENT_PASSWORD }),
    });
    const loginJson = await loginRes.json();
    if (!loginRes.ok || !loginJson?.success) {
      throw new Error(
        `Agent login failed (${loginRes.status}): ${JSON.stringify(loginJson)}`,
      );
    }

    await page.goto(new URL("/login", BASE_URL).toString(), {
      waitUntil: "domcontentloaded",
    });

    // Seed persisted auth state the web app expects after login.
    await page.evaluate(
      ({ user }) => {
        const authState = {
          state: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              created_at: user.created_at,
              is_active: user.is_active,
              has_preferences: user.has_preferences,
              roles: user.roles ?? ["agent"],
            },
            isAuthenticated: true,
            authReady: true,
            authStatus: "authenticated",
          },
          version: 1,
        };
        window.sessionStorage.setItem("auth-store", JSON.stringify(authState));
        window.sessionStorage.setItem(
          "session-store",
          JSON.stringify({
            state: {
              userMeta: {
                id: user.id,
                email: user.email,
                name: user.name,
                isAgent: true,
              },
              featureGates: {},
            },
            version: 1,
          }),
        );
      },
      { user: loginJson.user },
    );

    await page.goto(new URL("/library", BASE_URL).toString(), {
      waitUntil: "domcontentloaded",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: path.join(OUT_DIR, "01-library-closed.png"),
      fullPage: false,
    });

    const clientTrigger = page
      .locator('button[aria-haspopup="true"]')
      .filter({ hasText: /Me|Select client/i })
      .first();
    await clientTrigger.waitFor({ state: "visible", timeout: 15000 });
    await clientTrigger.click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole("dialog");
    await dialog.waitFor({ state: "visible", timeout: 10000 });

    await page.screenshot({
      path: path.join(OUT_DIR, "02-library-dropdown-open.png"),
      fullPage: false,
    });

    const dialogBox = await dialog.boundingBox();
    const triggerBox = await clientTrigger.boundingBox();
    if (!dialogBox || !triggerBox) {
      throw new Error("Could not measure dialog/trigger bounding boxes");
    }

    const dialogBelowTrigger =
      dialogBox.y >= triggerBox.y + triggerBox.height - 4;
    const dialogVisibleHeight = dialogBox.height > 80;

    console.log(
      JSON.stringify(
        {
          ok: dialogBelowTrigger && dialogVisibleHeight,
          dialogBelowTrigger,
          dialogVisibleHeight,
          dialogBox,
          triggerBox,
          screenshots: [
            path.join(OUT_DIR, "01-library-closed.png"),
            path.join(OUT_DIR, "02-library-dropdown-open.png"),
          ],
        },
        null,
        2,
      ),
    );

    if (!dialogBelowTrigger || !dialogVisibleHeight) {
      process.exitCode = 1;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
