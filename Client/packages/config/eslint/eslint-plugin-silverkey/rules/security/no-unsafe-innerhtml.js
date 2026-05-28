/**
 * Disallow innerHTML assignments unless the file is an allowlisted static map pin helper.
 */

const ALLOWLIST_SUFFIXES = [
  "/listingLocationPin.ts",
  "/scorePinMarker.ts",
  "/mapInstanceManager.ts",
  "/focusedCardMarker.ts",
  "/importantLocationRenderer.ts",
];

function isAllowlisted(filename) {
  return ALLOWLIST_SUFFIXES.some((suffix) => filename.endsWith(suffix));
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban innerHTML assignments except in allowlisted static SVG pin builders; use escapeHtml for dynamic text.",
    },
    schema: [],
    messages: {
      unsafe:
        "Avoid innerHTML with dynamic content. Use escapeHtml from packages/utils/dom/escapeHtml or add a static-pin allowlist entry.",
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (isAllowlisted(filename)) {
      return {};
    }

    return {
      AssignmentExpression(node) {
        if (
          node.left.type === "MemberExpression" &&
          !node.left.computed &&
          node.left.property.type === "Identifier" &&
          node.left.property.name === "innerHTML"
        ) {
          context.report({ node, messageId: "unsafe" });
        }
      },
    };
  },
};
