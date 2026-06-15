const path = require("path");

function normalizedPath(filename) {
  return filename.split(path.sep).join("/");
}

/** First segment after packages/features/ for the file being linted. */
function consumerFeatureFromFilename(filename) {
  const n = normalizedPath(filename);
  const marker = "packages/features/";
  const idx = n.indexOf(marker);
  if (idx === -1) return null;
  const rest = n.slice(idx + marker.length);
  const seg = rest.split("/")[0];
  return seg || null;
}

/** Normalize @/features/ alias to packages/features/ for consistent checks. */
function normalizeFeatureImportPath(importPath) {
  if (typeof importPath !== "string") return importPath;
  if (importPath.startsWith("@/features/")) {
    return `packages/features/${importPath.slice("@/features/".length)}`;
  }
  return importPath;
}

/** First segment after packages/features/ in an import source string. */
function providerFeatureFromImportSource(importPath) {
  const normalized = normalizeFeatureImportPath(importPath);
  if (typeof normalized !== "string" || !normalized.startsWith("packages/features/")) {
    return null;
  }
  const rest = normalized.slice("packages/features/".length);
  return rest.split("/")[0] || null;
}

function isUtilsModulePath(importPath) {
  const normalized = normalizeFeatureImportPath(importPath);
  return /\/utils(\/|$)/.test(normalized);
}

function isAllowedByPrefixes(importPath, allowImportPrefixes) {
  return allowImportPrefixes.some((p) => importPath === p || importPath.startsWith(`${p}/`));
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Discourage value imports from another feature's utils/: consolidate shared pure helpers in packages/utils (or lift types to packages/schemas). Type-only imports are allowed.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowImportPrefixes: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      crossFeatureUtils:
        'Feature "{{consumer}}" value-imports utils from "{{provider}}". Prefer packages/utils or the owning feature\'s public API.',
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const allowImportPrefixes = opt.allowImportPrefixes || [];
    const rawFilename = context.getFilename();
    const consumer = consumerFeatureFromFilename(rawFilename);
    if (!consumer) return {};

    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;

        const importPath = node.source.value;
        if (typeof importPath !== "string") return;
        const normalizedImportPath = normalizeFeatureImportPath(importPath);
        if (!normalizedImportPath.startsWith("packages/features/")) return;
        if (!isUtilsModulePath(importPath)) return;

        const provider = providerFeatureFromImportSource(importPath);
        if (!provider || provider === consumer) return;
        if (isAllowedByPrefixes(importPath, allowImportPrefixes)) return;

        context.report({
          node: node.source,
          messageId: "crossFeatureUtils",
          data: { consumer, provider },
        });
      },
    };
  },
};
