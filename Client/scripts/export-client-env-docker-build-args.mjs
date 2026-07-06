#!/usr/bin/env node
/**
 * Print Docker BuildKit --secret flags for bundle keys in a Client .env file.
 * Used by local prod-parity compose build (Makefile / smoke.sh).
 */
import path from "path";

import {
  formatDockerBuildSecrets,
  loadBundleEnvManifest,
  parseDotenvFile,
} from "./lib/bundle-env-manifest.mjs";

// The env file holds the bundle values and may live anywhere (e.g. a does-it-run temp dir),
// so resolve the manifest from this script's own Client root rather than the env file's dir.
const envFilePath = path.resolve(process.cwd(), process.argv[2] || "Client/.env");
const env = parseDotenvFile(envFilePath);
const manifest = loadBundleEnvManifest();
const args = formatDockerBuildSecrets(env, manifest);
process.stdout.write(`${args.join(" ")}\n`);
