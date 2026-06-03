"use strict";

/**
 * Warn when `response.error` is passed directly to user-visible surfaces.
 * Prefer resolveApiResultErrorMessage / resolveUserFacingMessage / useUserFacingErrorMessage.
 */

const UI_CALLEE_NAMES = new Set([
  "setError",
  "showWarningToast",
  "showErrorToast",
  "showToast",
  "showSuccessToast",
  "showInfoToast",
]);

const UI_JSX_PROP_NAMES = new Set(["message", "errorMessage", "userMessage", "error"]);

function isTestFile(filename) {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename) || filename.includes("/__tests__/");
}

function isApiLayerFile(filename) {
  return (
    /\/api\//.test(filename) ||
    /\/services\//.test(filename) ||
    /packages\/utils\/errorHandling\//.test(filename)
  );
}

function isTargetFile(filename) {
  if (!filename.includes("Client/") && !filename.includes("/Client/")) return false;
  if (isTestFile(filename) || isApiLayerFile(filename)) return false;
  return (
    filename.includes("packages/features/") ||
    filename.includes("packages/hooks/") ||
    filename.includes("packages/ui/") ||
    filename.includes("apps/web/") ||
    filename.includes("apps/mobile/")
  );
}

function isResponseErrorMember(node) {
  return (
    node.type === "MemberExpression" &&
    !node.computed &&
    node.object.type === "Identifier" &&
    node.object.name === "response" &&
    node.property.type === "Identifier" &&
    node.property.name === "error"
  );
}

function isLoggingCall(node) {
  const parent = node.parent;
  if (parent?.type !== "CallExpression") return false;
  const callee = parent.callee;
  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    const name = callee.property.name;
    return ["warn", "error", "info", "debug", "security"].includes(name);
  }
  return false;
}

function isComparisonContext(node) {
  let p = node.parent;
  while (p) {
    if (p.type === "BinaryExpression") return true;
    if (p.type === "CallExpression" || p.type === "VariableDeclarator") break;
    p = p.parent;
  }
  return false;
}

function isObjectPropertyValueForLogging(node) {
  const parent = node.parent;
  if (parent?.type !== "Property") return false;
  const grand = parent.parent;
  return grand?.type === "ObjectExpression";
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow passing response.error directly to UI surfaces (setError, toasts, error JSX props). " +
        "Use resolveApiResultErrorMessage or resolveUserFacingMessage instead.",
    },
    schema: [],
    messages: {
      directApiError:
        "Do not pass response.error directly to user-visible UI. Use resolveApiResultErrorMessage(response, fallback) or resolveUserFacingMessage(error, { fallbackMessage }).",
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!isTargetFile(filename)) return {};

    function reportIfLeaking(node) {
      if (!isResponseErrorMember(node)) return;
      if (isLoggingCall(node)) return;
      if (isComparisonContext(node)) return;

      const parent = node.parent;

      if (parent?.type === "CallExpression") {
        const callee = parent.callee;
        const name =
          callee.type === "Identifier"
            ? callee.name
            : callee.type === "MemberExpression" &&
                !callee.computed &&
                callee.property.type === "Identifier"
              ? callee.property.name
              : null;
        if (name && UI_CALLEE_NAMES.has(name)) {
          context.report({ node, messageId: "directApiError" });
        }
        return;
      }

      if (parent?.type === "JSXExpressionContainer") {
        const jsxParent = parent.parent;
        if (jsxParent?.type === "JSXAttribute" && jsxParent.name.type === "JSXIdentifier") {
          if (UI_JSX_PROP_NAMES.has(jsxParent.name.name)) {
            context.report({ node, messageId: "directApiError" });
          }
        }
        return;
      }

      if (
        isObjectPropertyValueForLogging(node) &&
        parent.type === "Property" &&
        parent.key.type === "Identifier" &&
        parent.key.name === "error"
      ) {
        return;
      }

      if (parent?.type === "VariableDeclarator" && parent.id.type === "Identifier") {
        const idName = parent.id.name;
        if (/errorMessage|userMessage|message/i.test(idName)) {
          context.report({ node, messageId: "directApiError" });
        }
      }
    }

    return {
      MemberExpression: reportIfLeaking,
    };
  },
};
