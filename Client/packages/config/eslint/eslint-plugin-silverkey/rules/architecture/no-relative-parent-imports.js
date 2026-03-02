/**
 * Disallow relative parent imports (../) to enforce alias-based imports (@/, packages/*).
 * Reduces merge conflicts and porting mistakes; supports RN and strict module boundaries.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow imports that use parent path segments (../). Use path aliases (@/, packages/*) instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowSamePackage: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useAlias:
        "Use path aliases instead of relative parent imports. Replace '{{path}}' with an alias (e.g. @/ or packages/*).",
    },
  },

  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source?.value;
        if (typeof source !== "string") return;
        if (!source.startsWith("..")) return;

        context.report({
          node: node.source,
          messageId: "useAlias",
          data: { path: source },
        });
      },
    };
  },
};
