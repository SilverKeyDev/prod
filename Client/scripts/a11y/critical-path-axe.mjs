#!/usr/bin/env node
/**
 * Critical-path WCAG 2.1 AA scan using Playwright + axe-core.
 * Requires a running web app (default http://localhost:5173) and auth storage from visual-parity.
 *
 * Usage (from Client/):
 *   pnpm exec playwright install chromium   # once
 *   pnpm a11y:critical-path
 *
 * Env:
 *   A11Y_BASE_URL — default http://localhost:5173
 *   A11Y_STORAGE_STATE — path to storage JSON (default scripts/visual-parity/.auth/web-storage.json)
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "../..");

const baseUrl = process.env.A11Y_BASE_URL ?? "http://localhost:5173";
const storageStatePath =
  process.env.A11Y_STORAGE_STATE ??
  path.join(clientRoot, "scripts/visual-parity/.auth/web-storage.json");

const ROUTES = ["/dashboard", "/profile", "/search", "/calendar", "/library"];

async function main() {
  if (!fs.existsSync(storageStatePath)) {
    console.warn(
      `[a11y] Storage state not found at ${storageStatePath}. Run pnpm parity:web:record-storage first, or set A11Y_STORAGE_STATE.`
    );
    process.exitCode = 1;
    return;
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();

  let failed = false;

  for (const route of ROUTES) {
    const url = `${baseUrl.replace(/\/$/, "")}${route}`;
    await page.goto(url, { waitUntil: "networkidle" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? "")
    );

    if (serious.length === 0) {
      console.log(
        `OK ${route} — ${results.violations.length} violations (${serious.length} serious/critical)`
      );
    } else {
      failed = true;
      console.error(`FAIL ${route} — ${serious.length} serious/critical violation(s):`);
      for (const v of serious) {
        console.error(`  - ${v.id}: ${v.description} (${v.nodes.length} nodes)`);
      }
    }
  }

  await browser.close();
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
