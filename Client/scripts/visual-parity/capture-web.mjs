import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

const VIEWPORT = { width: 390, height: 844 }; // iPhone 15 CSS px

const CLIENT_ROOT = path.resolve(import.meta.dirname, "../..");
const OUT_DIR = path.join(CLIENT_ROOT, ".visual-parity", "web");
const STORAGE_STATE_PATH = path.join(CLIENT_ROOT, ".visual-parity", "web.storageState.json");

const BASE_URL = process.env.PARITY_BASE_URL ?? "http://localhost:5173";

/**
 * Zustands persistSafe format: {"state":{...},"version":N}
 * Keep these helpers centralized so page state is deterministic.
 */
function persistValue(state, version) {
  return JSON.stringify({ state, version });
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeFileSegment(s) {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

const scenarios = [
  {
    name: "onboarding--step1",
    url: "/onboarding",
  },
  {
    name: "search--map",
    url: "/search",
    localStorage: [
      ["sk_search_preference", persistValue({ mode: "map", showAllHomesOnMap: false }, 2)],
    ],
  },
  {
    name: "search--reels",
    url: "/search",
    localStorage: [
      ["sk_search_preference", persistValue({ mode: "reels", showAllHomesOnMap: false }, 2)],
    ],
  },
  {
    name: "saved--homes",
    url: "/saved",
  },
  {
    name: "saved--documents",
    url: "/saved?view=documents",
  },
  {
    name: "dashboard",
    url: "/dashboard",
  },
  {
    name: "profile",
    url: "/profile",
  },
];

async function main() {
  ensureDir(OUT_DIR);

  const storageState = fs.existsSync(STORAGE_STATE_PATH) ? STORAGE_STATE_PATH : undefined;
  const browser = await chromium.launch({ headless: true });
  try {
    for (const scenario of scenarios) {
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 2,
        storageState,
      });

      // Ensure localStorage is set before the app boots.
      if (scenario.localStorage?.length) {
        await context.addInitScript((entries) => {
          try {
            /* eslint-disable-next-line no-undef */
            for (const [k, v] of entries) window.localStorage.setItem(k, v);
          } catch {
            // ignore
          }
        }, scenario.localStorage);
      }

      const page = await context.newPage();
      const fullUrl = new URL(scenario.url, BASE_URL).toString();
      await page.goto(fullUrl, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      // Allow layout to settle (fonts, async data, suspense).
      await page.waitForTimeout(750);

      const fileName = `${safeFileSegment(scenario.name)}.png`;
      const outPath = path.join(OUT_DIR, fileName);
      await page.screenshot({ path: outPath, fullPage: false });

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
