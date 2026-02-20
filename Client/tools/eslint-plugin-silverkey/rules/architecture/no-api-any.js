"use strict";

/**
 * Flag apiGet<any>, apiPost<any>, etc. in config/api.
 * API responses must use explicit types, not any.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "API client calls (apiGet, apiPost, etc.) must not use explicit any as type parameter. Use a proper type from schemas.",
    },
    schema: [],
    messages: {
      noApiAny:
        "Do not use 'any' as the type parameter for API client calls. Use a type from packages/schemas.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!filename.includes("packages/config/api")) return {};

    const apiMethods = new Set([
      "apiGet",
      "apiPost",
      "apiPut",
      "apiPatch",
      "apiDelete",
      "apiRequest",
    ]);

    return {
      CallExpression(node) {
        const callee = node.callee;
        const name =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" &&
                callee.property.type === "Identifier"
              ? callee.property.name
              : null;
        if (!name || !apiMethods.has(name)) return;

        const typeArgs =
          node.typeParameters ||
          (node.typeArguments && { params: node.typeArguments.params });
        if (!typeArgs || !typeArgs.params || typeArgs.params.length === 0)
          return;

        const firstArg = typeArgs.params[0];
        if (firstArg.type === "TSAnyKeyword") {
          context.report({
            node: firstArg,
            messageId: "noApiAny",
          });
        }
      },
    };
  },
};
