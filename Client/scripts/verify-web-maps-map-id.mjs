#!/usr/bin/env node
/**
 * Post-build check: fail when VERIFY_MAPS_MAP_ID=1 (or NODE_ENV=production) if
 * EXPO_PUBLIC_GOOGLE_MAPS_ID was not inlined into the web bundle.
 *
 * Usage: node scripts/verify-web-maps-map-id.mjs [clientRoot]
 * Default clientRoot: process.cwd() (run from Client/)
 */
import fs from "fs";
import path from "path";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");
const shouldVerify =
  process.env.VERIFY_MAPS_MAP_ID === "1" ||
  process.env.VERIFY_MAPS_MAP_ID === "true" ||
  process.env.NODE_ENV === "production";

if (!shouldVerify) {
  console.log("verify-web-maps-map-id: skipped (set VERIFY_MAPS_MAP_ID=1 to enforce)");
  process.exit(0);
}

function readShimMapId() {
  const shimPath = path.join(clientRoot, "node_modules", ".vite", "process-shim.cjs");
  if (!fs.existsSync(shimPath)) {
    return { mapId: null, source: "shim_missing" };
  }
  const content = fs.readFileSync(shimPath, "utf8");
  const match = content.match(/const env = (\{[\s\S]*?\});/);
  if (!match) {
    return { mapId: null, source: "shim_parse_failed" };
  }
  try {
    const env = JSON.parse(match[1]);
    const mapId = String(env.EXPO_PUBLIC_GOOGLE_MAPS_ID ?? "").trim();
    return { mapId: mapId || null, source: "process_shim" };
  } catch {
    return { mapId: null, source: "shim_json_failed" };
  }
}

function readDistMapIdHint() {
  const distDir = path.join(clientRoot, "dist");
  if (!fs.existsSync(distDir)) {
    return null;
  }
  const assetsDir = path.join(distDir, "assets");
  if (!fs.existsSync(assetsDir)) {
    return null;
  }
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith(".js") || name.endsWith(".map")) continue;
    const content = fs.readFileSync(path.join(assetsDir, name), "utf8");
    const keyMatch = content.match(/EXPO_PUBLIC_GOOGLE_MAPS_ID["']?\s*:\s*["']([^"']*)["']/);
    if (keyMatch) {
      const value = keyMatch[1].trim();
      if (value) return value;
    }
  }
  return null;
}

const shim = readShimMapId();
const distHint = readDistMapIdHint();
const mapId = shim.mapId || distHint;

if (!mapId) {
  console.error(
    "verify-web-maps-map-id: EXPO_PUBLIC_GOOGLE_MAPS_ID is missing or empty in the web build."
  );
  console.error(
    "  Set it at build time (Client/.env locally, GitHub secret EXPO_PUBLIC_GOOGLE_MAPS_ID for ci_web)."
  );
  console.error(`  Shim probe: ${shim.source}${shim.mapId === null ? "" : ` (empty)`}`);
  if (distHint === null) {
    console.error("  Dist probe: no non-empty map id found in dist/assets/*.js");
  }
  process.exit(1);
}

console.log(
  `verify-web-maps-map-id: OK (map id length ${mapId.length}, suffix …${mapId.length >= 4 ? mapId.slice(-4) : mapId})`
);
