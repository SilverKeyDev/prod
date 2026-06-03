#!/usr/bin/env node
/**
 * Print Docker --build-arg flags for manifest entries with dockerBuildArg: true.
 * Values come from process.env (AWS SM + optional GitHub fallback in ci_web).
 */
import path from "path";

import {
  defaultManifestPath,
  formatDockerBuildArgs,
  loadBundleEnvManifest,
} from "./lib/bundle-env-manifest.mjs";

const clientRoot = path.resolve(process.cwd(), process.argv[2] || ".");
const manifestPath = process.env.BUNDLE_ENV_MANIFEST || defaultManifestPath(clientRoot);
const manifest = loadBundleEnvManifest(manifestPath);
const args = formatDockerBuildArgs(process.env, manifest);
process.stdout.write(`${args.join(" ")}\n`);
