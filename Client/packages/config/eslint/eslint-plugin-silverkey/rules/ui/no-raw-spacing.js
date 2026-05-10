const path = require("path");

/** Tailwind arbitrary value with raw px anywhere in brackets, e.g. w-[37px], min-h-[40px] */
const ARBITRARY_PX_BRACKET_RE = /\[[^\]]*\d+px[^\]]*\]/g;

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

function bracketPxIsAllowed(inner) {
  const s = inner.slice(1, -1).trim();
  if (s.includes("var(--")) return true;
  if (s.includes("calc(")) return true;
  if (/\b(min|max|clamp)\(/.test(s)) return true;
  return false;
}

function checkArbitraryPxBrackets(context, val, reportNode) {
  ARBITRARY_PX_BRACKET_RE.lastIndex = 0;
  let m;
  while ((m = ARBITRARY_PX_BRACKET_RE.exec(val)) !== null) {
    if (bracketPxIsAllowed(m[0])) continue;
    context.report({
      node: reportNode,
      messageId: "rawSpacingArbitraryPxBracket",
    });
    return;
  }
}

function checkClassNameLiteral(context, node) {
  if (node.type !== "Literal" || typeof node.value !== "string") return;
  const val = node.value;
  let match;
  let reported = false;
  ARBITRARY_SPACING_RE.lastIndex = 0;
  while ((match = ARBITRARY_SPACING_RE.exec(val)) !== null) {
    const num = parseInt(match[1], 10);
    const unit = match[2] || "";
    if (unit === "px" || unit === "" || (unit === "rem" && num > 0 && num < 100)) {
      context.report({ node, messageId: "rawSpacingArbitrary" });
      reported = true;
      break;
    }
  }
  if (!reported) checkArbitraryPxBrackets(context, val, node);
}

function checkClassNameTemplateLiteral(context, node) {
  if (node.type !== "TemplateLiteral") return;
  node.quasis.forEach((quasi) => {
    const cooked = quasi.value?.cooked;
    if (typeof cooked !== "string") return;
    let match;
    let reported = false;
    ARBITRARY_SPACING_RE.lastIndex = 0;
    while ((match = ARBITRARY_SPACING_RE.exec(cooked)) !== null) {
      const unit = match[2] || "";
      if (unit === "px" || unit === "") {
        context.report({ node: quasi, messageId: "rawSpacingArbitrary" });
        reported = true;
        return;
      }
    }
    if (!reported) checkArbitraryPxBrackets(context, cooked, quasi);
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
      rawSpacingArbitraryPxBracket:
        "Do not use arbitrary Tailwind values with raw px in brackets (e.g. w-[37px]). Use design tokens, theme scale, or spacing() from packages/design-tokens.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const includePaths = opt.includePaths || ["packages/ui/", "packages/features/"];
    const allowedPaths = opt.allowedPaths || [];
    const isIncluded = includePaths.some((p) => filename.includes(p.replace(/\*\*/g, "")));
    const isAllowed = allowedPaths.some((p) => filename.includes(p.replace(/\*\*/g, "")));
    if (!isIncluded || isAllowed) return {};

    return {
      JSXAttribute(node) {
        if (node.name.name === "style" && node.value?.type === "JSXExpressionContainer") {
          const expr = node.value.expression;
          if (expr?.type === "ObjectExpression") checkStyleObject(context, expr);
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
