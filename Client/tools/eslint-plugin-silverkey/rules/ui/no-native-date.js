"use strict";

/**
 * Ban new Date() and Date.parse() in app and shared code.
 * Use the date wrapper (packages/utils/date) with Day.js for consistent parsing and formatting across V8 and Hermes (RN).
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not use new Date() or Date.parse(). Use the date wrapper from packages/utils/date (Day.js) for cross-platform consistency.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedPaths: {
            type: "array",
            items: { type: "string" },
            description:
              "Path substrings where native Date is allowed (e.g. utils/date, logger)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useDateWrapper:
        "Use the date wrapper from packages/utils/date (e.g. dateNow(), dateParse()) instead of native Date for cross-platform consistency (V8 vs Hermes).",
      noDateParse:
        "Use dateParse() from packages/utils/date instead of Date.parse().",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const allowedPaths = opt.allowedPaths || [
      "packages/utils/date/",
      "packages/utils/calendar/",
      "tools/eslint-plugin-silverkey/",
      "logger/",
    ];

    const isAllowed = allowedPaths.some((p) => filename.includes(p));
    if (isAllowed) return {};

    return {
      NewExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "Date") {
          context.report({
            node,
            messageId: "useDateWrapper",
          });
        }
      },

      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          node.object.name === "Date" &&
          node.property.type === "Identifier" &&
          node.property.name === "parse"
        ) {
          context.report({
            node,
            messageId: "noDateParse",
          });
        }
      },
    };
  },
};
