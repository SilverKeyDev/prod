"use strict";

/**
 * Ban platform checks (e.g. platform === 'ios') for feature releases.
 * Use useFeature('flag_name') instead so backend and app store review are decoupled.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Do not gate features by platform (e.g. platform === 'ios'). Use useFeature('flag_name') for feature rollout.",
    },
    schema: [
      {
        type: "object",
        properties: {
          featureHookName: {
            type: "string",
            default: "useFeature",
          },
          platformIdentifiers: {
            type: "array",
            items: { type: "string" },
            default: ["platform", "Platform", "OS", "os", "isIOS", "isAndroid"],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useFeatureFlag:
        "Do not gate features by platform. Use useFeature('flag_name') for rollout so backend and app store are decoupled.",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const platformIds = new Set(
      opt.platformIdentifiers || ["platform", "Platform", "OS", "os", "isIOS", "isAndroid"]
    );

    return {
      BinaryExpression(node) {
        if (node.operator !== "===" && node.operator !== "!==") return;

        const left = node.left.type === "Identifier" ? node.left.name : null;
        const right =
          node.right.type === "Literal" && typeof node.right.value === "string"
            ? node.right.value
            : null;

        const platformLeft =
          left && platformIds.has(left) && right && /^(ios|android|web)$/i.test(right);
        const platformRight =
          right && /^(ios|android|web)$/i.test(String(right)) && left && platformIds.has(left);

        if (platformLeft || platformRight) {
          context.report({
            node,
            messageId: "useFeatureFlag",
          });
        }
      },

      // Catch Platform.OS === 'ios' style
      MemberExpression(node) {
        if (
          node.object.type === "Identifier" &&
          (node.object.name === "Platform" || node.object.name === "platform")
        ) {
          if (
            node.property.type === "Identifier" &&
            (node.property.name === "OS" || node.property.name === "os")
          ) {
            // Report when this is in a comparison (parent will be BinaryExpression)
            const parent = node.parent;
            if (
              parent &&
              parent.type === "BinaryExpression" &&
              (parent.operator === "===" || parent.operator === "!==")
            ) {
              context.report({
                node: parent,
                messageId: "useFeatureFlag",
              });
            }
          }
        }
      },
    };
  },
};
