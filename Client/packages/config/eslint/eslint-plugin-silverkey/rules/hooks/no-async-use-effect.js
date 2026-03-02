"use strict";

/**
 * Ban useEffect(async () => ...) to avoid setState on unmounted component in RN
 * and to enforce cancellation/AbortController patterns in the request layer.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban async effect callbacks in useEffect; use sync effect + async IIFE with AbortController/cancellation.",
    },
    schema: [],
    messages: {
      noAsyncEffect:
        "useEffect callback must not be async. Use a synchronous effect that starts an async function and cleans up (e.g. AbortController) to avoid setState on unmounted component.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== "Identifier" || node.callee.name !== "useEffect") {
          return;
        }
        const arg = node.arguments[0];
        if (!arg) return;
        if (arg.type === "ArrowFunctionExpression" && arg.async) {
          context.report({ node: arg, messageId: "noAsyncEffect" });
          return;
        }
        if (arg.type === "FunctionExpression" && arg.async) {
          context.report({ node: arg, messageId: "noAsyncEffect" });
        }
      },
    };
  },
};
