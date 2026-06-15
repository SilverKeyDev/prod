#!/usr/bin/env node
/**
 * Print Docker BuildKit --secret flags for manifest entries with dockerBuildArg: true.
 * Values come from process.env (AWS SM + optional GitHub fallback in ci_web).
 * Secrets are not echoed in build logs (unlike --build-arg).
 */
import path from "path";

import {
  defaultManifestPath,
  formatDockerBuildSecrets,
  loadBundleEnvManifest,
} from "./lib/bundle-env-manifest.mjs";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");
const manifestPath = process.env.BUNDLE_ENV_MANIFEST || defaultManifestPath(clientRoot);
const manifest = loadBundleEnvManifest(manifestPath);
const args = formatDockerBuildSecrets(process.env, manifest);
process.stdout.write(`${args.join(" ")}\n`);
