#!/usr/bin/env node
/**
 * Verifies Metro path rewrites stay aligned with tsconfig.base.json for all
 * paths that target packages/*. Optionally reports Vite-only alias strings.
 *
 * Run: node scripts/audit-alias-tooling-drift.mjs (from Client/)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const require = createRequire(import.meta.url);

function loadTsconfigPaths() {
  const raw = fs.readFileSync(path.join(clientRoot, "tsconfig.base.json"), "utf8");
  const tsconfig = JSON.parse(raw);
  return (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};
}

function normalizeFromKey(from) {
  return from.endsWith("/*") ? from.slice(0, -2) + "/" : from;
}

function getExpectedPackagePathRewrites(paths) {
  const expected = new Map();
  for (const [from, toArr] of Object.entries(paths)) {
    const to = Array.isArray(toArr) ? toArr[0] : toArr;
    if (!to || typeof to !== "string") continue;
    if (!to.startsWith("packages/")) continue;
    const fromPrefix = normalizeFromKey(from);
    const toPrefix = to.endsWith("/*") ? to.slice(0, -2) + "/" : to;
    expected.set(fromPrefix, toPrefix);
  }
  return expected;
}

function loadMetroRewrites() {
  const { getMetroPathRewrites } = require(
    path.join(clientRoot, "packages/config/resolve-paths.cjs")
  );
  const rewrites = getMetroPathRewrites(clientRoot);
  return new Map(rewrites);
}

function extractViteStringFinds() {
  const viteResolvePath = path.join(clientRoot, "apps/web/vite.config.resolve.js");
  const src = fs.readFileSync(viteResolvePath, "utf8");
  /** @type {string[]} */
  const finds = [];
  const re = /find:\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    finds.push(m[1]);
  }
  return finds;
}

function main() {
  const paths = loadTsconfigPaths();
  const expected = getExpectedPackagePathRewrites(paths);
  const metro = loadMetroRewrites();
  const errors = [];

  for (const [fromPrefix, toPrefix] of expected) {
    const got = metro.get(fromPrefix);
    if (got !== toPrefix) {
      errors.push(
        `Metro rewrite mismatch for "${fromPrefix}": expected target prefix "${toPrefix}", got ${got === undefined ? "(missing)" : `"${got}"`}`
      );
    }
  }

  for (const fromPrefix of metro.keys()) {
    if (!expected.has(fromPrefix)) {
      errors.push(
        `Metro has unexpected rewrite "${fromPrefix}" → "${metro.get(fromPrefix)}" (not derived from tsconfig packages/* targets)`
      );
    }
  }

  if (errors.length) {
    console.error("alias-tooling-drift: FAILED\n" + errors.join("\n"));
    process.exit(1);
  }

  console.log(
    `alias-tooling-drift: OK (${expected.size} tsconfig → packages/ prefixes match Metro rewrites)`
  );

  const viteFinds = extractViteStringFinds();
  const tsconfigFromKeys = new Set([...expected.keys()]);
  const viteOnly = viteFinds.filter(
    (f) =>
      !f.startsWith("^") &&
      f !== "packages" &&
      f !== "logger" &&
      !tsconfigFromKeys.has(f + "/") &&
      !tsconfigFromKeys.has(f)
  );
  if (viteOnly.length) {
    console.warn(
      "alias-tooling-drift: info — Vite string `find` entries (review if tsconfig should own them):\n  " +
        [...new Set(viteOnly)].slice(0, 25).join("\n  ") +
        (viteOnly.length > 25 ? "\n  …" : "")
    );
  }
}

main();
