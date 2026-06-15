"use strict";

const fs = require("fs");
const path = require("path");

const RULES_ROOT = path.join(__dirname, "rules");

function loadRules() {
  const rules = {};
  const duplicates = new Set();

  function walk(dir) {
    for (const name of fs.readdirSync(dir).sort()) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith(".js")) {
        continue;
      }
      const ruleId = name.slice(0, -3);
      if (rules[ruleId]) {
        duplicates.add(ruleId);
        continue;
      }
      rules[ruleId] = require(full);
    }
  }

  walk(RULES_ROOT);

  if (duplicates.size) {
    throw new Error(
      `eslint-plugin-silverkey: duplicate rule ids: ${[...duplicates].sort().join(", ")}`
    );
  }

  return rules;
}

module.exports = { rules: loadRules() };
