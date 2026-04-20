"use strict";

/**
 * Warn when a string literal shaped like an i18n key (e.g. documents_upload.modal_title)
 * appears in JSX positions where it may render as raw visible text.
 *
 * Limitations: does not catch dynamic values (title={variable}). Tune ignoredFirstSegments /
 * exemptCalleeNames if legitimate non-i18n dotted strings false-positive.
 */

const DEFAULT_TRANSLATION_CALLEES = ["t", "formatMessage"];
const DEFAULT_EXEMPT_CALLEES = ["color"];
const DEFAULT_IGNORED_FIRST_SEGMENTS = ["brand", "neutral"];
const DEFAULT_JSX_TEXT_PROPS = [
  "title",
  "label",
  "placeholder",
  "description",
  "text",
  "message",
  "subtitle",
  "headerTitle",
  "aria-label",
  "ariaLabel",
  "alt",
  "hint",
  "header",
];

function looksLikeI18nKey(value, ignoredFirstSegments) {
  if (typeof value !== "string") return false;
  const parts = value.split(".");
  if (parts.length < 2) return false;
  const segmentRe = /^[a-z][a-z0-9_]*$/;
  for (const p of parts) {
    if (!segmentRe.test(p)) return false;
  }
  if (ignoredFirstSegments.includes(parts[0])) return false;
  return true;
}

function getCallCalleeName(callee) {
  if (callee.type === "Identifier") return callee.name;
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    callee.property.type === "Identifier"
  ) {
    return callee.property.name;
  }
  return null;
}

function isLiteralExempt(node, translationCalleeNames, exemptCalleeNames) {
  const parent = node.parent;
  if (!parent) return false;

  if (parent.type === "MemberExpression" && parent.computed && parent.property === node) {
    return true;
  }

  if (parent.type === "CallExpression" && parent.arguments[0] === node) {
    const name = getCallCalleeName(parent.callee);
    if (name && translationCalleeNames.includes(name)) return true;
    if (name && exemptCalleeNames.includes(name)) return true;
  }

  return false;
}

function isTranslationDefinitionFile(filename, skipTranslationDefinitionFiles) {
  if (!skipTranslationDefinitionFiles) return false;
  if (/\/types\/translations\.ts$/.test(filename)) return true;
  if (filename.includes("/packages/contexts/translations/")) return true;
  return false;
}

function isTestFile(filename) {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename) || filename.includes("/__tests__/");
}

function isTargetClientUiFile(filename) {
  if (!filename.includes("Client/") && !filename.includes("/Client/")) return false;
  return (
    filename.includes("packages/features/") ||
    filename.includes("packages/ui/") ||
    filename.includes("apps/web/") ||
    filename.includes("apps/mobile/")
  );
}

function jsxAttributePropName(node) {
  if (!node.name) return null;
  if (node.name.type === "JSXIdentifier") return node.name.name;
  if (node.name.type === "JSXNamespacedName") {
    return `${node.name.namespace.name}:${node.name.name.name}`;
  }
  return null;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow i18n-shaped string literals in JSX text surfaces (attrs / expression children). " +
        'Use t("key") or a translation map lookup so users never see raw keys like documents_upload.modal_title. ' +
        "Does not catch dynamic title={variable} leaks.",
    },
    schema: [
      {
        type: "object",
        properties: {
          translationCalleeNames: {
            type: "array",
            items: { type: "string" },
          },
          exemptCalleeNames: {
            type: "array",
            items: { type: "string" },
          },
          ignoredFirstSegments: {
            type: "array",
            items: { type: "string" },
          },
          jsxTextPropNames: {
            type: "array",
            items: { type: "string" },
          },
          skipTranslationDefinitionFiles: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      rawKey:
        'This looks like a translation key ({{key}}) in a user-visible JSX position. Use t("…") or a translation map so the raw key is not shown.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};

    const translationCalleeNames = opt.translationCalleeNames ?? DEFAULT_TRANSLATION_CALLEES;
    const exemptCalleeNames = opt.exemptCalleeNames ?? DEFAULT_EXEMPT_CALLEES;
    const ignoredFirstSegments = opt.ignoredFirstSegments ?? DEFAULT_IGNORED_FIRST_SEGMENTS;
    const jsxTextPropNames = new Set(opt.jsxTextPropNames ?? DEFAULT_JSX_TEXT_PROPS);
    const skipTranslationDefinitionFiles = opt.skipTranslationDefinitionFiles !== false;

    if (!isTargetClientUiFile(filename)) return {};
    if (isTestFile(filename)) return {};
    if (isTranslationDefinitionFile(filename, skipTranslationDefinitionFiles)) return {};

    function checkAndReport(literalNode) {
      const v = literalNode.value;
      if (typeof v !== "string") return;
      if (!looksLikeI18nKey(v, ignoredFirstSegments)) return;
      if (isLiteralExempt(literalNode, translationCalleeNames, exemptCalleeNames)) return;
      context.report({
        node: literalNode,
        messageId: "rawKey",
        data: { key: v },
      });
    }

    return {
      JSXAttribute(node) {
        const prop = jsxAttributePropName(node);
        if (!prop || !jsxTextPropNames.has(prop)) return;

        const val = node.value;
        if (!val) return;

        if (val.type === "Literal") {
          checkAndReport(val);
        } else if (val.type === "JSXExpressionContainer") {
          const exp = val.expression;
          if (exp && exp.type === "Literal") checkAndReport(exp);
        }
      },

      JSXExpressionContainer(node) {
        const exp = node.expression;
        if (!exp || exp.type !== "Literal") return;
        const parent = node.parent;
        if (parent.type !== "JSXElement" && parent.type !== "JSXFragment") return;
        checkAndReport(exp);
      },
    };
  },
};
