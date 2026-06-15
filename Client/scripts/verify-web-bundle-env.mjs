#!/usr/bin/env node
/**
 * Post-build: verify required EXPO_PUBLIC_* keys are inlined into the web bundle (process-shim + dist).
 * Manifest: Client/config/required-bundle-env.json
 *
 * Enforced when VERIFY_CLIENT_BUNDLE_ENV=1 or NODE_ENV=production.
 */
import path from "path";

import {
  defaultManifestPath,
  loadBundleEnvManifest,
  maskValueSuffix,
  readProcessShimEnv,
  verifyBundleEnvFromBuild,
} from "./lib/bundle-env-manifest.mjs";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");

const shouldVerify =
  process.env.VERIFY_CLIENT_BUNDLE_ENV === "1" ||
  process.env.VERIFY_CLIENT_BUNDLE_ENV === "true" ||
  process.env.NODE_ENV === "production";

if (!shouldVerify) {
  console.log(
    "verify-web-bundle-env: skipped (set VERIFY_CLIENT_BUNDLE_ENV=1 or build with NODE_ENV=production)"
  );
  process.exit(0);
}

const manifestPath = process.env.BUNDLE_ENV_MANIFEST || defaultManifestPath(clientRoot);
const manifest = loadBundleEnvManifest(manifestPath);
const { ok, errors, warnings } = verifyBundleEnvFromBuild(clientRoot, manifest, {
  requiredOnly: true,
});

for (const w of warnings) {
  console.warn(`verify-web-bundle-env: warning: ${w}`);
}

if (!ok) {
  console.error("verify-web-bundle-env: required bundle environment variables failed:");
  for (const e of errors) {
    console.error(`  - ${e}`);
  }
  console.error(
    "  Set values at build time (Client/.env locally; AWS Secrets Manager primary + GitHub fallback in ci_web)."
  );
  console.error(`  Manifest: ${manifestPath}`);
  process.exit(1);
}

const shimEnv = readProcessShimEnv(clientRoot);
for (const spec of manifest.variables.filter((v) => v.required)) {
  const value = shimEnv?.[spec.key] ?? "";
  const mask = maskValueSuffix(value);
  console.log(
    `verify-web-bundle-env: OK ${spec.key} (length ${mask.length}, suffix …${mask.suffix})`
  );
}

process.exit(0);
