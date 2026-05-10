const path = require("path");

function isDimensionsGet(callee) {
  if (callee?.type !== "MemberExpression") return false;
  if (callee.object?.type !== "Identifier" || callee.object.name !== "Dimensions") return false;
  if (callee.property?.type !== "Identifier" || callee.property.name !== "get") return false;
  return true;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer useWindowDimensions() (or a shared dimensions hook) instead of Dimensions.get() in React components so dimensions update on rotation and fold.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedPaths: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useHook:
        "Avoid Dimensions.get() in UI code — use useWindowDimensions() from react-native or a shared dimensions helper so values stay current.",
    },
  },

  create(context) {
    const filename = context.getFilename().split(path.sep).join("/");
    const opt = context.options[0] || {};
    const allowedPaths = opt.allowedPaths || [
      "packages/utils/platform/dimensions.native.ts",
      "PropertyImageGallery.native.styles.ts",
    ];
    if (allowedPaths.some((p) => filename.includes(p.replace(/\*\*/g, "")))) return {};

    const inNativeScope =
      /\.native\.(ts|tsx)$/.test(filename) || filename.includes("/apps/mobile/");
    if (!inNativeScope) return {};

    return {
      CallExpression(node) {
        if (!isDimensionsGet(node.callee)) return;
        context.report({ node, messageId: "useHook" });
      },
    };
  },
};
