#!/usr/bin/env node
/**
 * Post-build check: fail when VERIFY_POSTHOG=1 (or NODE_ENV=production) if
 * EXPO_PUBLIC_POSTHOG_KEY was not inlined or PostHog hosts point at localhost.
 *
 * Usage: node scripts/verify-web-posthog-config.mjs [clientRoot]
 * Default clientRoot: process.cwd() (run from Client/)
 */
import fs from "fs";
import path from "path";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");
const shouldVerify =
  process.env.VERIFY_POSTHOG === "1" ||
  process.env.VERIFY_POSTHOG === "true" ||
  process.env.NODE_ENV === "production";

if (!shouldVerify) {
  console.log("verify-web-posthog-config: skipped (set VERIFY_POSTHOG=1 to enforce)");
  process.exit(0);
}

function readShimPosthogKey() {
  const shimPath = path.join(clientRoot, "node_modules", ".vite", "process-shim.cjs");
  if (!fs.existsSync(shimPath)) {
    return { key: null, source: "shim_missing" };
  }
  const content = fs.readFileSync(shimPath, "utf8");
  const match = content.match(/const env = (\{[\s\S]*?\});/);
  if (!match) {
    return { key: null, source: "shim_parse_failed" };
  }
  try {
    const env = JSON.parse(match[1]);
    const key = String(env.EXPO_PUBLIC_POSTHOG_KEY ?? "").trim();
    return { key: key || null, source: "process_shim" };
  } catch {
    return { key: null, source: "shim_json_failed" };
  }
}

function readDistAssets() {
  const assetsDir = path.join(clientRoot, "dist", "assets");
  if (!fs.existsSync(assetsDir)) {
    return [];
  }
  return fs
    .readdirSync(assetsDir)
    .filter((name) => name.endsWith(".js") && !name.endsWith(".map"))
    .map((name) => fs.readFileSync(path.join(assetsDir, name), "utf8"));
}

function readDistPosthogKeyHint() {
  for (const content of readDistAssets()) {
    const keyMatch = content.match(/EXPO_PUBLIC_POSTHOG_KEY["']?\s*:\s*["']([^"']*)["']/);
    if (keyMatch) {
      const value = keyMatch[1].trim();
      if (value) return value;
    }
  }
  return null;
}

function findBadPosthogHostConfig() {
  const badPatterns = [
    /api_host\s*[:=]\s*["']https?:\/\/localhost/i,
    /api_host\s*[:=]\s*["']https?:\/\/127\.0\.0\.1/i,
    /ui_host\s*[:=]\s*["']https?:\/\/localhost/i,
    /ui_host\s*[:=]\s*["']https?:\/\/127\.0\.0\.1/i,
    /host\s*[:=]\s*["']https?:\/\/localhost[^"']*posthog/i,
  ];
  const hits = [];
  for (const content of readDistAssets()) {
    for (const pattern of badPatterns) {
      if (pattern.test(content)) {
        hits.push(pattern.source);
      }
    }
  }
  return [...new Set(hits)];
}

function distIncludesUsCloudApiHost() {
  return readDistAssets().some((content) => content.includes("https://us.i.posthog.com"));
}

const shim = readShimPosthogKey();
const distHint = readDistPosthogKeyHint();
const posthogKey = shim.key || distHint;

if (!posthogKey) {
  console.error(
    "verify-web-posthog-config: EXPO_PUBLIC_POSTHOG_KEY is missing or empty in the web build."
  );
  console.error(
    "  Set it at build time (Client/.env locally, GitHub repository variable EXPO_PUBLIC_POSTHOG_KEY for ci_web)."
  );
  console.error(`  Shim probe: ${shim.source}${shim.key === null ? "" : " (empty)"}`);
  if (distHint === null) {
    console.error("  Dist probe: no non-empty PostHog key found in dist/assets/*.js");
  }
  process.exit(1);
}

const badHostConfigs = findBadPosthogHostConfig();
if (badHostConfigs.length > 0) {
  console.error(
    "verify-web-posthog-config: dist/assets/*.js contains localhost PostHog api_host/ui_host configuration."
  );
  console.error(`  Patterns matched: ${badHostConfigs.join(", ")}`);
  process.exit(1);
}

if (!distIncludesUsCloudApiHost()) {
  console.error(
    "verify-web-posthog-config: dist/assets/*.js does not include https://us.i.posthog.com (expected SilverKey PostHog API host)."
  );
  process.exit(1);
}

console.log(
  `verify-web-posthog-config: OK (key length ${posthogKey.length}, suffix …${posthogKey.length >= 4 ? posthogKey.slice(-4) : posthogKey})`
);
