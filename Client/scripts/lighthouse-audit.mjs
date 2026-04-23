#!/usr/bin/env node
/**
 * Run Lighthouse for key SPA paths (mobile + desktop).
 * From repo Client root: `pnpm --filter @silverkey/web run lighthouse:audit`
 * Start a production-like server first, e.g. `pnpm build:web && pnpm preview:web` (port 4173).
 * Env:
 *   LIGHTHOUSE_BASE_URL — origin (default http://127.0.0.1:4173)
 *   LIGHTHOUSE_MIN_SCORE — optional 0–1; exits 1 if any performance score is below
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "../apps/web");
const lighthouseBin = path.join(webRoot, "node_modules", ".bin", "lighthouse");
const outDir = path.join(
  webRoot,
  "lighthouse-reports",
  new Date().toISOString().replace(/[:.]/g, "-")
);
const base = (process.env.LIGHTHOUSE_BASE_URL || "http://127.0.0.1:4173").replace(/\/$/, "");
const minScore = process.env.LIGHTHOUSE_MIN_SCORE
  ? Number.parseFloat(process.env.LIGHTHOUSE_MIN_SCORE)
  : null;

const paths = ["/", "/login", "/search"];
const formFactors = [
  {
    name: "mobile",
    args: ["--form-factor=mobile", "--only-categories=performance,accessibility,seo"],
  },
  {
    name: "desktop",
    args: ["--preset=desktop", "--only-categories=performance,accessibility,seo"],
  },
];

if (!existsSync(lighthouseBin)) {
  console.error("Lighthouse not found. From Client, run: pnpm install (includes apps/web).");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

const results = [];
for (const { name, args } of formFactors) {
  for (const p of paths) {
    const label = p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "-");
    const fileBase = `${name}-${label}`;
    const outPrefix = path.join(outDir, fileBase);
    const url = `${base}${p === "/" ? "/" : p}`;

    execFileSync(
      lighthouseBin,
      [url, ...args, "--output=json,html", `--output-path=${outPrefix}`, "--quiet"],
      { stdio: "inherit" }
    );

    const jsonPath = `${outPrefix}.report.json`;
    if (!existsSync(jsonPath)) {
      console.error(`Expected report at ${jsonPath}`);
      process.exit(1);
    }
    const j = JSON.parse(readFileSync(jsonPath, "utf8"));
    const perf = j.categories?.performance?.score;
    if (typeof perf === "number") {
      results.push({ url, name, performance: Math.round(perf * 100) });
    }
  }
}

const summaryPath = path.join(outDir, "summary.json");
writeFileSync(summaryPath, JSON.stringify({ base, results }, null, 2), "utf8");
console.log(`Lighthouse reports written to ${outDir}`);
console.log(
  "Performance scores:",
  results.map((r) => `${r.name} ${r.url} -> ${r.performance}`).join(" | ")
);

if (minScore != null && !Number.isNaN(minScore)) {
  for (const r of results) {
    const s = (r.performance ?? 0) / 100;
    if (s < minScore) {
      console.error(
        `Below LIGHTHOUSE_MIN_SCORE ${minScore}: ${r.url} (${r.name}) = ${r.performance}`
      );
      process.exit(1);
    }
  }
}
