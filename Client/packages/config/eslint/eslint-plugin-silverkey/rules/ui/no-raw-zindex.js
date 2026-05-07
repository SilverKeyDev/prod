const path = require("path");

/**
 * Match raw numeric Tailwind z-index classes: z-10, z-20, z-30, z-40, z-50, z-60 …
 * Also matches arbitrary z-index values like z-[9999].
 * Does NOT match z-0, z-auto, or named tokens (z-header, z-sidebar, z-dropdown, etc.).
 */
const RAW_NUMERIC_Z_CLASS_RE = /\bz-(?:\[[\d]+(?:px|rem)?\]|\d+)\b/g;

/** zIndex values > this threshold (exclusive) are flagged in inline style objects. */
const LOCAL_STACK_THRESHOLD = 5;

function checkClassNameString(context, node, value) {
  if (typeof value !== "string") return;
  RAW_NUMERIC_Z_CLASS_RE.lastIndex = 0;
  let match;
  while ((match = RAW_NUMERIC_Z_CLASS_RE.exec(value)) !== null) {
    const cls = match[0];
    // Allow z-0 — it is semantically meaningful (reset to 0)
    if (cls === "z-0") continue;
    context.report({ node, messageId: "rawZIndexClass", data: { cls } });
  }
}

function checkClassNameLiteral(context, node) {
  if (node.type !== "Literal" || typeof node.value !== "string") return;
  checkClassNameString(context, node, node.value);
}

function checkClassNameTemplateLiteral(context, node) {
  if (node.type !== "TemplateLiteral") return;
  for (const quasi of node.quasis) {
    const cooked = quasi.value?.cooked;
    if (typeof cooked === "string") {
      checkClassNameString(context, quasi, cooked);
    }
  }
}

function checkStyleObject(context, node) {
  if (node.type !== "ObjectExpression") return;
  for (const prop of node.properties) {
    if (prop.type !== "Property") continue;
    const keyName =
      prop.key.type === "Identifier"
        ? prop.key.name
        : prop.key.type === "Literal"
          ? String(prop.key.value)
          : null;
    if (keyName !== "zIndex") continue;

    const value = prop.value;
    if (!value) continue;

    if (value.type === "Literal" && typeof value.value === "number") {
      if (value.value > LOCAL_STACK_THRESHOLD) {
        context.report({ node: prop, messageId: "rawZIndexStyle", data: { value: value.value } });
      }
    }
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw numeric z-index values in className (e.g. z-10, z-50) or inline style objects (e.g. zIndex: 9000). Use named Tailwind z-index tokens (z-header, z-dropdown, z-modal, …) or Z_LAYERS from packages/design-tokens for inline styles.",
    },
    schema: [
      {
        type: "object",
        properties: {
          includePaths: {
            type: "array",
            items: { type: "string" },
            description: "Paths where the rule applies.",
          },
          allowedPaths: {
            type: "array",
            items: { type: "string" },
            description: "Paths where raw z-index is explicitly allowed.",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawZIndexClass:
        "Avoid raw numeric Tailwind z-index class '{{cls}}'. Use a named z-index token instead (e.g. z-header, z-sidebar, z-dropdown, z-toast, z-overlay, z-modal). See packages/design-tokens/tokens/zLayers.ts.",
      rawZIndexStyle:
        "Avoid numeric zIndex literal ({{value}}) in style objects. Import Z_LAYERS from packages/design-tokens and use e.g. Z_LAYERS.modal. See packages/design-tokens/tokens/zLayers.ts.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const includePaths = opt.includePaths || [
      "packages/ui/",
      "packages/features/",
      "apps/web/",
      "apps/mobile/",
    ];
    const allowedPaths = opt.allowedPaths || [
      // The token definition itself is allowed
      "packages/design-tokens/tokens/zLayers",
      // Tailwind preset derives zIndex from Z_LAYERS — the Object.fromEntries call is fine
      "packages/config/tailwind/",
      // Map overlay domain uses its own integer-based layer system; not UI chrome
      "mapOverlayLayerOrder",
      "propertyCommuteNative.constants",
    ];

    const isIncluded = includePaths.some((p) => filename.includes(p.replace(/\*\*/g, "")));
    const isAllowed = allowedPaths.some((p) => filename.includes(p.replace(/\*\*/g, "")));

    if (!isIncluded || isAllowed) return {};

    return {
      JSXAttribute(node) {
        if (node.name.name === "className") {
          if (node.value?.type === "Literal") {
            checkClassNameLiteral(context, node.value);
          } else if (node.value?.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr?.type === "Literal") checkClassNameLiteral(context, expr);
            else if (expr?.type === "TemplateLiteral") checkClassNameTemplateLiteral(context, expr);
          }
        }
        if (node.name.name === "style" && node.value?.type === "JSXExpressionContainer") {
          const expr = node.value.expression;
          if (expr?.type === "ObjectExpression") checkStyleObject(context, expr);
        }
      },
      // Also catch StyleSheet.create({ shell: { zIndex: 8000 } }) patterns
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "StyleSheet" &&
          node.callee.property.name === "create"
        ) {
          const arg = node.arguments[0];
          if (arg?.type === "ObjectExpression") {
            for (const outerProp of arg.properties) {
              if (outerProp.type === "Property" && outerProp.value?.type === "ObjectExpression") {
                checkStyleObject(context, outerProp.value);
              }
            }
          }
        }
      },
      // Catch variable style objects: const panelStyle: CSSProperties = { zIndex: 60 }
      VariableDeclarator(node) {
        if (node.init?.type === "ObjectExpression") {
          checkStyleObject(context, node.init);
        }
      },
    };
  },
};
