"use strict";

const path = require("path");

const ALLOWLIST = [
  "packages/config/env.ts",
  "apps/web/vite.config.ts",
  "vite.config.ts",
  "vitest.config.",
  "postcss.config.",
  "tailwind.config.",
  "*.config.js",
  "*.config.mjs",
];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban process.env outside config. Use getEnv() from packages/config instead. Only packages/config/env.ts and build configs may access process.env.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowlist: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useGetEnv:
        "Use getEnv() from packages/config instead of process.env. Only packages/config/env.ts and build configs may access process.env.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const allowlist = opt.allowlist || ALLOWLIST;

    const effectiveAllowlist = allowlist.length > 0 ? allowlist : ALLOWLIST;
    const allowed = effectiveAllowlist.some((pattern) => {
      if (pattern.endsWith(".")) return filename.includes(pattern);
      if (pattern.includes("*")) {
        const regex = new RegExp(
          "^.*" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$"
        );
        return regex.test(filename);
      }
      return filename.includes(pattern) || filename.endsWith(pattern);
    });

    if (allowed) return {};

    return {
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "process" &&
          node.property.type === "Identifier" &&
          node.property.name === "env"
        ) {
          context.report({
            node: node.property,
            messageId: "useGetEnv",
          });
        }
      },
    };
  },
};
