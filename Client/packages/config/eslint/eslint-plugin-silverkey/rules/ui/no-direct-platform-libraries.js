"use strict";

const path = require("path");

/**
 * Enforce use of platform adapters: do not import React-specific or DOM-specific
 * libraries (framer-motion, headlessui, react-virtuoso, embla-carousel, hls.js,
 * react-phone-number-input) outside adapter paths. Use packages/ui adapters so
 * web and React Native share the same API.
 */
function pathMatches(filename, pattern) {
  const normalized = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
  const re = new RegExp(normalized);
  return re.test(filename);
}

function isInAllowedPath(filename, allowedPaths) {
  if (!allowedPaths || allowedPaths.length === 0) return false;
  return allowedPaths.some((p) => pathMatches(filename, p));
}

function isTypeOnlyImport(node) {
  return node.importKind === "type";
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not import React/DOM-specific libraries outside adapter paths. Use packages/ui adapters (e.g. MotionView, Portal, Virtuoso) so web and RN share the same API.",
    },
    schema: [
      {
        type: "object",
        properties: {
          restrictedPackages: {
            type: "array",
            items: { type: "string" },
            description: "Package names (or patterns) that may only be imported in allowedPaths.",
          },
          allowedPaths: {
            type: "array",
            items: { type: "string" },
            description:
              "Path patterns (e.g. **/adapters/**) where restricted packages are allowed.",
          },
          allowTypeOnlyImports: {
            type: "boolean",
            default: true,
            description:
              "If true, type-only imports (import type { X } from 'pkg') are allowed anywhere.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useAdapter:
        "Do not import '{{package}}' here. Use the platform adapter from packages/ui (e.g. MotionView from packages/ui/components/system/adapters/motion, Portal from packages/ui/components/structure/portal) so web and React Native share the same API.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const restrictedPackages = opt.restrictedPackages || [
      "framer-motion",
      "@headlessui/react",
      "react-virtuoso",
      "embla-carousel-react",
      "hls.js",
      "react-phone-number-input",
    ];
    const allowedPaths = opt.allowedPaths || [];
    const allowTypeOnlyImports = opt.allowTypeOnlyImports !== false;

    const inScope =
      filename.includes("packages/ui/") ||
      filename.includes("packages/features/") ||
      filename.includes("apps/web/");
    if (!inScope) return {};

    if (isInAllowedPath(filename, allowedPaths)) return {};

    function isRestricted(importPath) {
      return restrictedPackages.some((pkg) => {
        if (importPath === pkg) return true;
        if (importPath.startsWith(pkg + "/")) return true;
        return false;
      });
    }

    return {
      ImportDeclaration(node) {
        const importPath = node.source && node.source.value;
        if (!importPath || typeof importPath !== "string") return;
        if (!isRestricted(importPath)) return;
        if (allowTypeOnlyImports && isTypeOnlyImport(node)) return;

        context.report({
          node: node.source,
          messageId: "useAdapter",
          data: {
            package: importPath.split("/")[0],
          },
        });
      },
    };
  },
};
