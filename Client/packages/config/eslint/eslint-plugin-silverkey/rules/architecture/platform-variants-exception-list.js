"use strict";

const fs = require("fs");
const path = require("path");

function loadVariantPaths() {
  try {
    const variantsPath = path.join(__dirname, "../../../../platform/variants.json");
    const raw = fs.readFileSync(variantsPath, "utf8");
    const variants = JSON.parse(raw);
    const paths = new Set();

    if (Array.isArray(variants)) {
      for (const variant of variants) {
        if (variant && typeof variant.webPath === "string" && variant.webPath.length > 0) {
          paths.add(variant.webPath);
        }
        if (variant && typeof variant.nativePath === "string" && variant.nativePath.length > 0) {
          paths.add(variant.nativePath);
        }
      }
    }

    return paths;
  } catch {
    // If config is missing or invalid, fall back to empty set so the rule is effectively disabled.
    return new Set();
  }
}

const variantPaths = loadVariantPaths();

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow direct imports of platform-specific modules (.web/.native) unless they are listed in config/platform/variants.json.",
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
      disallowedPlatformImport:
        "Platform-specific import '{{importPath}}' is not in config/platform/variants.json. Prefer a shared implementation or explicitly add this path to the variants config.",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const allowlist = new Set(opt.allowlist || []);

    return {
      ImportDeclaration(node) {
        const importPath = typeof node.source.value === "string" ? node.source.value : null;
        if (!importPath) return;

        // Only care about explicit .web / .native imports.
        const isPlatformSpecific = importPath.includes(".native.") || importPath.includes(".web.");
        if (!isPlatformSpecific) return;

        // Relative imports are often resolved by bundlers to platform files; we keep this rule
        // focused on explicit platform imports via aliases / package paths.
        if (importPath.startsWith(".") || importPath.startsWith("/")) {
          return;
        }

        if (allowlist.has(importPath)) {
          return;
        }

        if (variantPaths.has(importPath)) {
          return;
        }

        context.report({
          node: node.source,
          messageId: "disallowedPlatformImport",
          data: { importPath },
        });
      },
    };
  },
};
