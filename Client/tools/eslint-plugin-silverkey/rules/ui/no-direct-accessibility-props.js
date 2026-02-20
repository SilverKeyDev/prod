"use strict";

/**
 * In feature and page components, do not use aria-label or accessibilityLabel directly.
 * Use the primitive's unified prop (e.g. label, accessibilityLabel on Button) so
 * the design system can map to the correct platform attribute (aria-label vs accessibilityLabel).
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "No direct accessibility props (aria-label, accessibilityLabel) in feature/page components. Use the UI primitive's label (or description) prop instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedInPaths: {
            type: "array",
            items: { type: "string" },
            description:
              "Path substrings where direct a11y props are allowed (e.g. components/ui)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useLabelProp:
        "Do not use {{ prop }} here. Use the component's unified 'label' (or 'description') prop so the design system can map to aria-label / accessibilityLabel for web and RN.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const allowedInPaths = opt.allowedInPaths || ["apps/web/components/ui/"];

    const isAllowed = allowedInPaths.some((p) => filename.includes(p));
    if (isAllowed) return {};

    const isFeatureOrPage =
      filename.includes("apps/web/features/") ||
      filename.includes("apps/web/pages/");
    if (!isFeatureOrPage) return {};

    const bannedProps = ["aria-label", "aria-labelledby", "accessibilityLabel"];

    return {
      JSXAttribute(node) {
        const name = node.name.type === "JSXIdentifier" ? node.name.name : null;
        if (!name || !bannedProps.includes(name)) return;

        context.report({
          node,
          messageId: "useLabelProp",
          data: { prop: name },
        });
      },
    };
  },
};
