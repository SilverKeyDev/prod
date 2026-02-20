/**
 * Require a reason when disabling @typescript-eslint/no-explicit-any.
 * Example: eslint-disable-next-line @typescript-eslint/no-explicit-any - third-party API has no types
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "When disabling @typescript-eslint/no-explicit-any, the comment must include a reason (e.g. ' - third-party API has no types').",
    },
    schema: [
      {
        type: "object",
        properties: {
          minReasonLength: { type: "number" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingReason:
        "Disabling @typescript-eslint/no-explicit-any requires a reason. Add a short explanation after the rule name, e.g. ' - third-party API has no types'.",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const minReasonLength = opt.minReasonLength ?? 5;

    const sourceCode = context.getSourceCode?.() ?? context.sourceCode;
    if (!sourceCode) return {};

    return {
      Program() {
        const comments = sourceCode.getAllComments();
        const ruleName = "no-explicit-any";
        const fullRule = "@typescript-eslint/no-explicit-any";

        for (const comment of comments) {
          const value = comment.value.trim();
          // Only consider actual eslint-disable comments, not doc text that mentions the rule name
          if (!value.startsWith("eslint-disable") || !value.includes(ruleName))
            continue;

          // Check for eslint-disable-next-line or eslint-disable
          const afterRule = value.includes(fullRule)
            ? value.split(fullRule)[1]
            : value.split(ruleName)[1];
          if (afterRule == null) continue;

          const rest = afterRule.trim();
          // Allow reason after comma, -- or -
          const hasReason =
            rest.length >= minReasonLength &&
            (rest.startsWith("-") ||
              rest.startsWith(",") ||
              /^\s*[a-zA-Z0-9]/.test(rest));

          if (!hasReason) {
            context.report({
              node: comment,
              messageId: "missingReason",
            });
          }
        }
      },
    };
  },
};
