"use strict";

/**
 * In feature and app page components, IconButton and icon-only Button must have a label.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "IconButton and icon-only Button in features/pages must have a label for screen readers.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedInPaths: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingLabel: "{{ component }} requires a 'label' prop for accessibility (WCAG 4.1.2).",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const allowedInPaths = opt.allowedInPaths || ["packages/ui/"];

    if (allowedInPaths.some((p) => filename.includes(p))) return {};

    const isFeatureOrPage =
      filename.includes("packages/features/") ||
      filename.includes("apps/web/pages/") ||
      filename.includes("apps/web/app/") ||
      filename.includes("apps/mobile/");
    if (!isFeatureOrPage) return {};

    function getJsxName(openingElement) {
      const n = openingElement.name;
      if (n.type === "JSXIdentifier") return n.name;
      if (n.type === "JSXMemberExpression" && n.property?.type === "JSXIdentifier") {
        return n.property.name;
      }
      return null;
    }

    function hasProp(openingElement, propName) {
      return openingElement.attributes.some(
        (attr) =>
          attr.type === "JSXAttribute" &&
          attr.name.type === "JSXIdentifier" &&
          attr.name.name === propName &&
          attr.value != null
      );
    }

    return {
      JSXOpeningElement(node) {
        const name = getJsxName(node);
        if (!name) return;

        if (name === "IconButton") {
          if (!hasProp(node, "label")) {
            context.report({
              node,
              messageId: "missingLabel",
              data: { component: "IconButton" },
            });
          }
          return;
        }

        if (name === "Button" && hasProp(node, "hideTextBelow") && !hasProp(node, "label")) {
          context.report({
            node,
            messageId: "missingLabel",
            data: { component: "Button (hideTextBelow)" },
          });
        }
      },
    };
  },
};
