#!/usr/bin/env node
/**
 * Print Docker BuildKit --secret flags for bundle keys in a Client .env file.
 * Used by local prod-parity compose build (Makefile / smoke.sh).
 */
import path from "path";

import {
  defaultManifestPath,
  formatDockerBuildSecrets,
  loadBundleEnvManifest,
  parseDotenvFile,
} from "./lib/bundle-env-manifest.mjs";

const envFilePath = path.resolve(process.cwd(), process.argv[2] || "Client/.env");
const clientRoot = path.resolve(path.dirname(envFilePath));
const env = parseDotenvFile(envFilePath);
const manifest = loadBundleEnvManifest(defaultManifestPath(clientRoot));
const args = formatDockerBuildSecrets(env, manifest);
process.stdout.write(`${args.join(" ")}\n`);
