/**
 * CJS wrapper for ESLint flat config. Use this when the config is loaded in a
 * context that does not support ESM (e.g. "Cannot use 'import.meta' outside a module").
 * Loads the real ESM config in a proper module context.
 */
"use strict";
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports -- This file is CommonJS for Node tooling */
/* global require, module, __dirname */

const path = require("node:path");
const pathToEsmConfig = path.join(__dirname, "eslint.config.js");

module.exports = import(pathToEsmConfig).then((m) => m.default);
