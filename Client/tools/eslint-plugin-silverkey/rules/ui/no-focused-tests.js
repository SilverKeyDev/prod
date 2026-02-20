"use strict";

/**
 * Ban .only( in test files so CI runs the full suite and tests work on both web and RN.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban focused tests (describe.only, it.only, test.only) so no .only in repo.",
    },
    schema: [],
    messages: {
      noOnly:
        "Focused tests (.only) are not allowed. Remove .only before committing.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const isTestFile =
      /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename) ||
      filename.includes("/__tests__/");

    if (!isTestFile) return {};

    return {
      MemberExpression(node) {
        if (
          node.property.type !== "Identifier" ||
          node.property.name !== "only"
        ) {
          return;
        }
        const obj = node.object;
        const isDescribeItTest =
          obj.type === "Identifier" &&
          ["describe", "it", "test"].includes(obj.name);
        if (isDescribeItTest) {
          context.report({ node: node.property, messageId: "noOnly" });
        }
      },
    };
  },
};
