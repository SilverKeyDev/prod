const path = require("path");

/** Web desktop is the visual source of truth; this rule targets RN and mobile app code only. */
const LEGACY_VIEWPORT_RE = /\b100v[hw]\b/;

function isMobileOrNativeFile(filename) {
  const posix = filename.split(path.sep).join("/");
  return /\.native\.(ts|tsx)$/.test(posix) || posix.includes("/apps/mobile/");
}

function checkString(context, node, raw) {
  if (typeof raw !== "string" || !LEGACY_VIEWPORT_RE.test(raw)) return;
  context.report({
    node,
    messageId: "legacyViewport",
    data: { snippet: raw.match(LEGACY_VIEWPORT_RE)?.[0] ?? "" },
  });
}

function checkTemplate(context, node) {
  if (node.type !== "TemplateLiteral") return;
  for (const q of node.quasis) {
    const c = q.value?.cooked;
    if (typeof c === "string" && LEGACY_VIEWPORT_RE.test(c)) {
      context.report({
        node: q,
        messageId: "legacyViewport",
        data: { snippet: c.match(LEGACY_VIEWPORT_RE)?.[0] ?? "" },
      });
      return;
    }
  }
}

function walkStyleObject(context, expr) {
  if (!expr || expr.type !== "ObjectExpression") return;
  for (const prop of expr.properties) {
    if (prop.type !== "Property" || prop.key.type !== "Identifier") continue;
    const v = prop.value;
    if (v?.type === "Literal" && typeof v.value === "string") checkString(context, v, v.value);
    if (v?.type === "TemplateLiteral") checkTemplate(context, v);
    if (v?.type === "JSXExpressionContainer") {
      const inner = v.expression;
      if (inner?.type === "Literal" && typeof inner.value === "string")
        checkString(context, inner, inner.value);
      if (inner?.type === "TemplateLiteral") checkTemplate(context, inner);
    }
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow 100vh/100vw in className/style on React Native and mobile app code; prefer dvh/dvw. Does not apply to shared web components (desktop is source of truth).",
    },
    schema: [
      {
        type: "object",
        properties: {
          includeOnlyMobileNative: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      legacyViewport:
        "Avoid {{snippet}} in mobile/native UI — use dynamic viewport units (e.g. 100dvh, 100dvw) for reliable layouts on phones and tablets.",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const includeOnlyMobileNative = opt.includeOnlyMobileNative !== false;
    if (includeOnlyMobileNative && !isMobileOrNativeFile(filename)) return {};

    return {
      Literal(node) {
        if (typeof node.value !== "string" || !LEGACY_VIEWPORT_RE.test(node.value)) return;
        const parent = node.parent;
        if (
          parent?.type === "JSXAttribute" &&
          (parent.name?.name === "className" || parent.name?.name === "style")
        ) {
          checkString(context, node, node.value);
        }
        if (parent?.type === "Property" && parent.key.type === "Identifier") {
          const obj = parent.parent;
          if (obj?.type === "ObjectExpression") {
            const jsx = obj.parent;
            if (jsx?.type === "JSXExpressionContainer" && jsx.parent?.name?.name === "style") {
              checkString(context, node, node.value);
            }
          }
        }
      },
      TemplateLiteral(node) {
        const parent = node.parent;
        if (
          parent?.type === "JSXAttribute" &&
          (parent.name?.name === "className" || parent.name?.name === "style")
        ) {
          checkTemplate(context, node);
        }
      },
      JSXAttribute(node) {
        if (node.name?.name !== "className" && node.name?.name !== "style") return;
        const v = node.value;
        if (!v || v.type !== "JSXExpressionContainer") return;
        const ex = v.expression;
        if (ex?.type === "Literal" && typeof ex.value === "string")
          checkString(context, ex, ex.value);
        if (ex?.type === "TemplateLiteral") checkTemplate(context, ex);
        if (ex?.type === "ObjectExpression" && node.name.name === "style")
          walkStyleObject(context, ex);
      },
    };
  },
};
