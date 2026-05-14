#!/usr/bin/env node
/**
 * Emit a JSON manifest of tsconfig path mappings whose targets live under packages/.
 * Used to compare with Vite/Metro over time (see documentation/internal/alias-matrix.md).
 *
 * Run: node scripts/generate-bundler-path-manifest.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(__dirname, "..");
const outPath = path.join(clientRoot, "packages/config/bundler-path-manifest.json");

function loadTsconfigPaths() {
  const raw = fs.readFileSync(path.join(clientRoot, "tsconfig.base.json"), "utf8");
  const tsconfig = JSON.parse(raw);
  return (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) || {};
}

function buildManifest() {
  const paths = loadTsconfigPaths();
  /** @type {Record<string, string>} */
  const packagePaths = {};
  for (const [from, toArr] of Object.entries(paths)) {
    const to = Array.isArray(toArr) ? toArr[0] : toArr;
    if (!to || typeof to !== "string") continue;
    if (!to.startsWith("packages/")) continue;
    packagePaths[from] = to;
  }
  return {
    generatedFrom: "Client/tsconfig.base.json",
    packagePaths,
  };
}

const check = process.argv.includes("--check");
const manifest = buildManifest();
const json = `${JSON.stringify(manifest, null, 2)}\n`;

if (check) {
  if (!fs.existsSync(outPath)) {
    console.error(
      `generate-bundler-path-manifest: missing ${outPath}; run without --check to write.`
    );
    process.exit(1);
  }
  const existing = fs.readFileSync(outPath, "utf8");
  if (existing !== json) {
    console.error(
      "generate-bundler-path-manifest: --check failed (manifest drift). Regenerate with:"
    );
    console.error("  node Client/scripts/generate-bundler-path-manifest.mjs");
    process.exit(1);
  }
  console.log("generate-bundler-path-manifest: --check OK");
} else {
  fs.writeFileSync(outPath, json);
  console.log(`generate-bundler-path-manifest: wrote ${outPath}`);
}
