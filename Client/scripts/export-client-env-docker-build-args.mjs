#!/usr/bin/env node
/**
 * Print Docker --build-arg flags for every entry in a Client .env file.
 * Used by local prod-parity compose build (Makefile / smoke.sh).
 */
import path from "path";

import {
  formatEnvFileDockerBuildArgs,
  parseDotenvFile,
} from "./lib/bundle-env-manifest.mjs";

const envFilePath = path.resolve(process.cwd(), process.argv[2] || "Client/.env");
const env = parseDotenvFile(envFilePath);
const args = formatEnvFileDockerBuildArgs(env);
process.stdout.write(`${args.join(" ")}\n`);
