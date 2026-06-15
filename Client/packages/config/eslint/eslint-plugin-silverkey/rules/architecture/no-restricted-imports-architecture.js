const path = require("path");

function isTypeOnlyImport(node) {
  return node.importKind === "type";
}

function patternMatches(importPath, patterns) {
  return patterns.some((pattern) => {
    const regexPattern = pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
    const regex = new RegExp(`^${regexPattern}`);
    return regex.test(importPath);
  });
}

function isForbidden(importPath, forbidden) {
  return patternMatches(importPath, forbidden);
}

function isAllowedException(importPath, allowedExceptions) {
  return patternMatches(importPath, allowedExceptions);
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce architecture import boundaries: apps/web, packages/ui, and packages/features must not import packages/config/api or packages/services directly except: (1) packages/services/http and packages/services/security are allowed for all; (2) in packages/features only files under api/ or services/ may import config/api or services (use allowedPathsInFeatures).",
    },
    schema: [
      {
        type: "object",
        properties: {
          forbidden: {
            type: "array",
            items: { type: "string" },
          },
          allowedExceptions: {
            type: "array",
            items: { type: "string" },
          },
          /** In packages/features, only these path segments may import forbidden targets (e.g. api/, services/). */
          allowedPathsInFeatures: {
            type: "array",
            items: { type: "string" },
          },
          loggerPath: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenImport:
        "Components in packages/ui or packages/features must use hooks, not import services or API clients directly. Import from packages/hooks/ instead. If you need a type, use 'import type' instead.",
      forbiddenService:
        "Components cannot import from packages/services/{{servicePath}}. Use a hook from packages/hooks/ instead.",
      forbiddenApi:
        "Components cannot import from packages/config/api/{{apiPath}}. Use a hook from packages/hooks/ instead.",
      appForbiddenService:
        "apps/web cannot import from packages/services/{{servicePath}}. Use a hook from packages/hooks/ (or packages/features) instead.",
      appForbiddenApi:
        "apps/web cannot import from packages/config/api/{{apiPath}}. Use a hook from packages/hooks/ (or packages/features) instead.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const forbidden = opt.forbidden || [];
    const allowedExceptions = opt.allowedExceptions || [];
    const allowedPathsInFeatures = opt.allowedPathsInFeatures || [];

    const inUiOrFeatures =
      filename.includes("packages/ui/") || filename.includes("packages/features/");
    const inAppLayer = filename.includes("apps/web/") || filename.includes("apps/mobile/");
    if (!inUiOrFeatures && !inAppLayer) return {};
    if (filename.includes("packages/ui/components/media/ui/")) return {};

    /** In packages/features, only api/ and services/ may import config/api or services. */
    const inFeaturesAllowedPath =
      filename.includes("packages/features/") &&
      allowedPathsInFeatures.some((segment) => filename.includes(segment));

    return {
      ImportDeclaration(node) {
        const importPath = node.source.value;
        if (
          importPath.startsWith(".") ||
          importPath.startsWith("/") ||
          !importPath.includes("packages/")
        ) {
          return;
        }
        if (isTypeOnlyImport(node)) return;
        if (!isForbidden(importPath, forbidden)) return;
        if (isAllowedException(importPath, allowedExceptions)) return;
        if (inFeaturesAllowedPath) return;

        if (importPath.includes("packages/services/")) {
          const servicePath = importPath.replace(/^.*packages\/services\//, "");
          context.report({
            node: node.source,
            messageId: inAppLayer ? "appForbiddenService" : "forbiddenService",
            data: { servicePath },
          });
        } else if (importPath.includes("packages/config/api/")) {
          const apiPath = importPath.replace(/^.*packages\/config\/api\//, "");
          context.report({
            node: node.source,
            messageId: inAppLayer ? "appForbiddenApi" : "forbiddenApi",
            data: { apiPath },
          });
        } else {
          context.report({
            node: node.source,
            messageId: "forbiddenImport",
          });
        }
      },
    };
  },
};
