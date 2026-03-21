#!/usr/bin/env node
/**
 * Post-build check: fail if the web dist contains any "react-native" module specifier
 * or .native. chunk names (would cause "Failed to resolve module specifier" in production).
 * Usage: node check-web-dist-no-native.mjs [distDir]
 * Default distDir: process.cwd()/dist
 */
import fs from "fs";
import path from "path";

const distDir = path.resolve(process.cwd(), process.argv[2] || "dist");
if (!fs.existsSync(distDir)) {
  console.error("check-web-dist-no-native: dist dir not found:", distDir);
  process.exit(1);
}

const reactNativeSpecifier =
  /from\s+["']react-native["']|import\s+.*\s+from\s+["']react-native["']/;
const nativeChunkName = /\.native\./;
let failed = false;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      scanDir(full);
      continue;
    }
    if (e.name.endsWith(".js") && !e.name.endsWith(".map")) {
      const content = fs.readFileSync(full, "utf8");
      if (reactNativeSpecifier.test(content)) {
        console.error(
          "check-web-dist-no-native: found react-native specifier in",
          path.relative(distDir, full)
        );
        failed = true;
      }
    }
    if (nativeChunkName.test(e.name)) {
      console.error(
        "check-web-dist-no-native: found .native. in output name:",
        path.relative(distDir, full)
      );
      failed = true;
    }
  }
}

scanDir(distDir);
if (failed) {
  console.error(
    "check-web-dist-no-native: web build must not contain react-native or .native modules. Fix Vite stubbing."
  );
  process.exit(1);
}
