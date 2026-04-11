"use strict";

const path = require("path");

/** Internal feature subfolders that must not be imported from one feature into another. */
const FEATURE_INTERNAL_SEGMENTS = [
  "components",
  "hooks",
  "utils",
  "store",
  "types",
  "api",
  "services",
];

/**
 * Extract feature name from a path like packages/features/agent/... or packages/features/dashboard/utils/...
 * @param {string} pathSegment - Path with forward slashes
 * @returns {string|null} - Feature name or null if not under packages/features/<name>/
 */
function getFeatureNameFromPath(pathSegment) {
  const match = pathSegment.match(/packages\/features\/([^/]+)(?:\/|$)/);
  return match ? match[1] : null;
}

/**
 * Resolve a relative import against the current file's directory.
 * @param {string} fromDir - Directory of the importing file (forward slashes)
 * @param {string} importPath - Relative path (e.g. "../../agent/components/X")
 * @returns {string|null} - Resolved path with forward slashes, or null if not under packages/features/
 */
function resolveRelative(fromDir, importPath) {
  const parts = importPath.split("/").filter(Boolean);
  let dir = fromDir;
  for (const p of parts) {
    if (p === "..") {
      const idx = dir.lastIndexOf("/");
      if (idx === -1) return null;
      dir = dir.slice(0, idx);
    } else if (p !== ".") {
      dir = dir ? `${dir}/${p}` : p;
    }
  }
  return dir.includes("packages/features/") ? dir : null;
}

/**
 * Check if import path targets another feature's internal folder (components, hooks, utils, store, types, api, services).
 * @param {string} importPath - Literal import source (e.g. "packages/features/agent/components/X" or "../../agent/components/X")
 * @param {string} [fromDir] - Directory of importing file (for relative resolution)
 * @returns {{ feature: string, segment: string } | null} - Imported feature and segment, or null
 */
function getCrossFeatureInternal(importPath, fromDir) {
  let resolved = importPath;
  if (importPath.startsWith(".") && fromDir) {
    resolved = resolveRelative(fromDir, importPath);
    if (!resolved) return null;
  }
  if (!resolved.startsWith("packages/features/")) return null;
  const rest = resolved.slice("packages/features/".length);
  const parts = rest.split("/");
  if (parts.length < 2) return null;
  const [featureName, firstSegment] = parts;
  if (!FEATURE_INTERNAL_SEGMENTS.includes(firstSegment)) return null;
  return { feature: featureName, segment: firstSegment };
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not import one feature's internals into another (e.g. agent component into calendar, negotiate hook into search/property-details). Apps must not import feature internals, use the feature barrel or shared packages. Shared code used by multiple features should live in packages/hooks, packages/utils, or packages/ui.",
    },
    schema: [],
    messages: {
      crossFeatureImport:
        "Do not import from another feature's {{segment}}. Feature '{{importedFeature}}' internals (components, hooks, utils, store, types, api, services) cannot be used by feature '{{currentFeature}}'. Move shared code to packages/hooks, packages/utils, packages/ui, or a parent feature folder.",
      appImportFeatureInternals:
        "App must not import feature internals ({{importedFeature}}/{{segment}}). Use the feature barrel (e.g. packages/features/{{importedFeature}}) or shared packages (packages/hooks, packages/utils, packages/ui).",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");

    const currentFeature = getFeatureNameFromPath(filename);
    const inApp =
      filename.includes("apps/web/") || filename.includes("apps/mobile/");
    if (!currentFeature && !inApp) return {};

    const fromDir = filename.includes("/")
      ? filename.replace(/\/[^/]+$/, "")
      : "";

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (typeof importPath !== "string") return;

        const cross = getCrossFeatureInternal(importPath, fromDir);
        if (!cross) return;

        if (inApp) {
          context.report({
            node: node.source,
            messageId: "appImportFeatureInternals",
            data: {
              importedFeature: cross.feature,
              segment: cross.segment,
            },
          });
          return;
        }

        if (cross.feature === currentFeature) return;

        context.report({
          node: node.source,
          messageId: "crossFeatureImport",
          data: {
            segment: cross.segment,
            importedFeature: cross.feature,
            currentFeature,
          },
        });
      },
    };
  },
};
