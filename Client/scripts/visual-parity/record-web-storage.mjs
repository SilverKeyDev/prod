import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

import { chromium } from "playwright";

const CLIENT_ROOT = path.resolve(import.meta.dirname, "../..");
const OUT_PATH = path.join(CLIENT_ROOT, ".visual-parity", "web.storageState.json");
const BASE_URL = process.env.PARITY_BASE_URL ?? "http://localhost:5173";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function waitForEnter(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  ensureDir(path.dirname(OUT_PATH));
  const browser = await chromium.launch({ headless: false });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.goto(new URL("/login", BASE_URL).toString(), { waitUntil: "domcontentloaded" });

  console.log(
    "\nLog in in the opened browser. When you’re at a signed-in page, press Enter here.\n"
  );
  await waitForEnter("Press Enter to save storage state… ");

  await context.storageState({ path: OUT_PATH });

  console.log(`\nSaved storageState to ${OUT_PATH}\n`);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
