#!/usr/bin/env node
/**
 * Pre-Docker-build: assert required bundle env vars are non-empty (AWS SM only in ci_web).
 * Reads Client/config/required-bundle-env.json — logs lengths only, never secret values.
 */
import path from "path";

import {
  assertBundleSecretsPresentWithValidation,
  defaultManifestPath,
  loadBundleEnvManifest,
} from "./lib/bundle-env-manifest.mjs";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");
const manifestPath = process.env.BUNDLE_ENV_MANIFEST || defaultManifestPath(clientRoot);
const manifest = loadBundleEnvManifest(manifestPath);
const { ok, errors } = assertBundleSecretsPresentWithValidation(process.env, manifest);

for (const spec of manifest.variables) {
  if (!spec.key) continue;
  const len = String(process.env[spec.key] ?? "").trim().length;
  if (len > 0) {
    const tag = spec.required ? "required" : "optional";
    console.log(`assert-bundle-secrets: ${spec.key} is set (${tag}, length ${len})`);
  }
}

if (!ok) {
  for (const e of errors) {
    console.error(`::error::${e}`);
  }
  console.error(`Manifest: ${manifestPath}`);
  process.exit(1);
}

console.log("assert-bundle-secrets: all required bundle secrets are present and valid");
