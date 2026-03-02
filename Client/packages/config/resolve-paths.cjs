/**
 * Shared path resolution for Metro and (optionally) Vite.
 * Reads tsconfig.base.json so path aliases stay in sync across web and mobile.
 * CommonJS (.cjs) so Metro's require() works when package.json has "type": "module".
 *
 * Used by: apps/mobile/metro.config.cjs
 * Same paths are reflected in: apps/web/vite.config.ts (see tsconfig.base.json paths)
 */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports -- This file is CommonJS for Metro */
/* global require, module */

const path = require("node:path");
const fs = require("node:fs");

/**
 * Load tsconfig.base.json paths from Client root.
 * @param {string} clientRoot - Absolute path to Client directory (monorepo root for the client)
 * @returns {{ [key: string]: string[] }} compilerOptions.paths or {}
 */
function loadTsconfigPaths(clientRoot) {
  const tsconfigPath = path.join(clientRoot, "tsconfig.base.json");
  if (!fs.existsSync(tsconfigPath)) return {};
  try {
    const raw = fs.readFileSync(tsconfigPath, "utf8");
    const tsconfig = JSON.parse(raw);
    return (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};
  } catch {
    return {};
  }
}

/**
 * Convert tsconfig paths to Metro resolver [from, to] rewrites.
 * Only includes mappings that resolve under packages/* so Metro's resolvePackagesPath can resolve them.
 * More specific (longer) from-prefixes are first so they match before shorter ones.
 *
 * @param {string} clientRoot - Absolute path to Client directory
 * @returns {[string, string][]} Sorted array of [fromPrefix, toPrefix] for Metro PACKAGES_PATH_REWRITES
 */
function getMetroPathRewrites(clientRoot) {
  const paths = loadTsconfigPaths(clientRoot);
  const rewrites = [];

  for (const [from, toArr] of Object.entries(paths)) {
    const to = Array.isArray(toArr) ? toArr[0] : toArr;
    if (!to || typeof to !== "string") continue;
    // Only include targets under packages/ so Metro's resolvePackagesPath can resolve
    if (!to.startsWith("packages/")) continue;
    const toPrefix = to.endsWith("/*") ? to.slice(0, -2) + "/" : to;
    const fromPrefix = from.endsWith("/*") ? from.slice(0, -2) + "/" : from;
    rewrites.push([fromPrefix, toPrefix]);
  }

  // Longest from-prefix first so e.g. @ui/ matches before @ui
  rewrites.sort((a, b) => b[0].length - a[0].length);
  return rewrites;
}

module.exports = {
  loadTsconfigPaths,
  getMetroPathRewrites,
};
