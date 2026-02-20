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
        "Enforce architecture import boundaries: components must use hooks, not import services or API clients directly.",
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
          loggerPath: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      forbiddenImport:
        "Components in apps/web/components must use hooks, not import services or API clients directly. Import from packages/hooks/ instead. If you need a type, use 'import type' instead.",
      forbiddenService:
        "Components cannot import from packages/services/{{servicePath}}. Use a hook from packages/hooks/ instead.",
      forbiddenApi:
        "Components cannot import from packages/config/api/{{apiPath}}. Use a hook from packages/hooks/ instead.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const forbidden = opt.forbidden || [];
    const allowedExceptions = opt.allowedExceptions || [];

    if (!filename.includes("apps/web/components/")) return {};
    if (filename.includes("apps/web/components/ui/")) return {};

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

        if (importPath.includes("packages/services/")) {
          const servicePath = importPath.replace(/^.*packages\/services\//, "");
          context.report({
            node: node.source,
            messageId: "forbiddenService",
            data: { servicePath },
          });
        } else if (importPath.includes("packages/config/api/")) {
          const apiPath = importPath.replace(/^.*packages\/config\/api\//, "");
          context.report({
            node: node.source,
            messageId: "forbiddenApi",
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
