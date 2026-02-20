"use strict";

/**
 * In apps/web, ban useXStore.getState() so state is only read via hooks/selectors.
 * Prevents non-React store access and keeps patterns safe for RN unmount behavior.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban .getState() on Zustand store hooks in apps/web; use selectors/hooks only.",
    },
    schema: [],
    messages: {
      noGetState:
        "Do not use .getState() on the store in apps/web. Use the hook with a selector instead, e.g. useXStore((s) => s.field), or use an integration hook from packages/hooks/store.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!filename.includes("apps/web/")) return {};

    return {
      MemberExpression(node) {
        if (
          node.property.type === "Identifier" &&
          node.property.name === "getState"
        ) {
          context.report({
            node: node.property,
            messageId: "noGetState",
          });
        }
      },
    };
  },
};
