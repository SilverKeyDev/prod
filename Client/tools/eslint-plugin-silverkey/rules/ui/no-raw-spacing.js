const path = require("path");

/** Tailwind arbitrary spacing that looks like raw px or number: p-[13px], m-[8], gap-[13px], etc. */
const ARBITRARY_SPACING_RE = /[\w-]-\[\s*(\d+)(px|rem|em)?\s*\]/g;
/** Style property keys that represent spacing */
const SPACING_KEYS = new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "rowGap",
  "columnGap",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
]);

function isRawSpacingValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return true;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d+px$/.test(trimmed)) return true;
    if (/^\d+$/.test(trimmed)) return true;
  }
  return false;
}

function checkStyleObject(context, node) {
  if (node.type !== "ObjectExpression") return;
  for (const prop of node.properties) {
    if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;
    const keyName = prop.key.name;
    if (!SPACING_KEYS.has(keyName)) continue;
    const value = prop.value;
    if (!value) continue;
    if (value.type === "Literal" && isRawSpacingValue(value.value)) {
      context.report({ node: prop, messageId: "rawSpacingStyle" });
      continue;
    }
    if (value.type === "JSXExpressionContainer") {
      const inner = value.expression;
      if (inner.type === "Literal" && isRawSpacingValue(inner.value)) {
        context.report({ node: prop, messageId: "rawSpacingStyle" });
      }
    }
  }
}

function checkClassNameLiteral(context, node) {
  if (node.type !== "Literal" || typeof node.value !== "string") return;
  const val = node.value;
  let match;
  ARBITRARY_SPACING_RE.lastIndex = 0;
  while ((match = ARBITRARY_SPACING_RE.exec(val)) !== null) {
    const num = parseInt(match[1], 10);
    const unit = match[2] || "";
    if (
      unit === "px" ||
      unit === "" ||
      (unit === "rem" && num > 0 && num < 100)
    ) {
      context.report({ node, messageId: "rawSpacingArbitrary" });
      break;
    }
  }
}

function checkClassNameTemplateLiteral(context, node) {
  if (node.type !== "TemplateLiteral") return;
  node.quasis.forEach((quasi) => {
    const cooked = quasi.value?.cooked;
    if (typeof cooked !== "string") return;
    let match;
    ARBITRARY_SPACING_RE.lastIndex = 0;
    while ((match = ARBITRARY_SPACING_RE.exec(cooked)) !== null) {
      const unit = match[2] || "";
      if (unit === "px" || unit === "") {
        context.report({ node: quasi, messageId: "rawSpacingArbitrary" });
        break;
      }
    }
  });
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw numeric or pixel spacing in design-system-consuming code. Use spacing() from packages/design-tokens or Tailwind token classes (e.g. p-2, gap-4).",
    },
    schema: [
      {
        type: "object",
        properties: {
          includePaths: {
            type: "array",
            items: { type: "string" },
          },
          allowedPaths: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawSpacingStyle:
        "Do not use raw numeric/pixel spacing in style objects. Use spacing() from packages/design-tokens or Tailwind classes (e.g. p-2, gap-4).",
      rawSpacingArbitrary:
        "Do not use arbitrary raw spacing in className (e.g. p-[13px]). Use Tailwind token classes (p-2, gap-4) or spacing() from packages/design-tokens.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const includePaths = opt.includePaths || [
      "apps/web/components/",
      "apps/web/features/",
    ];
    const allowedPaths = opt.allowedPaths || [];
    const isIncluded = includePaths.some((p) =>
      filename.includes(p.replace(/\*\*/g, "")),
    );
    const isAllowed = allowedPaths.some((p) =>
      filename.includes(p.replace(/\*\*/g, "")),
    );
    if (!isIncluded || isAllowed) return {};

    return {
      JSXAttribute(node) {
        if (
          node.name.name === "style" &&
          node.value?.type === "JSXExpressionContainer"
        ) {
          const expr = node.value.expression;
          if (expr?.type === "ObjectExpression")
            checkStyleObject(context, expr);
        }
        if (node.name.name === "className" && node.value) {
          if (node.value.type === "Literal") {
            checkClassNameLiteral(context, node.value);
          } else if (node.value.type === "JSXExpressionContainer") {
            const expr = node.value.expression;
            if (expr?.type === "Literal") {
              checkClassNameLiteral(context, expr);
            } else if (expr?.type === "TemplateLiteral") {
              checkClassNameTemplateLiteral(context, expr);
            }
          }
        }
      },
    };
  },
};
