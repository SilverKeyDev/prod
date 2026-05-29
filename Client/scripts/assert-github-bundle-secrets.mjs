#!/usr/bin/env node
/**
 * Pre-Docker-build: assert GitHub Actions secrets for required bundle env vars are non-empty.
 * Reads Client/config/required-bundle-env.json — logs lengths only, never secret values.
 */
import path from "path";

import {
  assertGithubSecretsPresent,
  defaultManifestPath,
  loadBundleEnvManifest,
} from "./lib/bundle-env-manifest.mjs";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");
const manifestPath = process.env.BUNDLE_ENV_MANIFEST || defaultManifestPath(clientRoot);
const manifest = loadBundleEnvManifest(manifestPath);
const { ok, errors } = assertGithubSecretsPresent(process.env, manifest);

for (const spec of manifest.variables.filter((v) => v.required && v.githubSecret)) {
  const secretName = spec.githubSecret ?? spec.key;
  const len = String(process.env[secretName] ?? "").trim().length;
  if (len > 0) {
    console.log(`assert-github-bundle-secrets: ${secretName} is set (length ${len})`);
  }
}

if (!ok) {
  for (const e of errors) {
    console.error(`::error::${e}`);
  }
  console.error(`Manifest: ${manifestPath}`);
  process.exit(1);
}

console.log("assert-github-bundle-secrets: all required GitHub bundle secrets are present");
