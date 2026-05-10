"use strict";

const stylelint = require("stylelint");

const ruleName = "silverkey/no-html-body-overflow-x-hidden";

const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected:
    "Avoid overflow-x: hidden on html/body (it often masks layout bugs). Scope overflow on a child container, or use a stylelint-disable comment if truly required.",
});

/** Selector contains `html` or `body` as a top-level compound (not e.g. `.body-text`). */
function selectorTouchesHtmlOrBodyRoot(selector) {
  const s = selector.trim();
  // Split loosely on comma for combined selectors
  return s.split(",").some((part) => {
    const p = part.trim();
    return (
      /^html\b/i.test(p) ||
      /^body\b/i.test(p) ||
      (/\b(html|body)\b/i.test(p) && /^[.#[]?]?html\b/i.test(p)) ||
      (/\b(html|body)\b/i.test(p) && /^[.#[]?]?body\b/i.test(p))
    );
  });
}

module.exports = stylelint.createPlugin(ruleName, (primaryOption) => (root, result) => {
  const validOptions = stylelint.utils.validateOptions(result, ruleName, {
    actual: primaryOption,
    possible: [true, false],
  });
  if (!validOptions || primaryOption === false) return;

  root.walkRules((ruleNode) => {
    const selector = ruleNode.selector;
    if (!selector || !selectorTouchesHtmlOrBodyRoot(selector)) return;

    ruleNode.walkDecls((decl) => {
      if (decl.prop.toLowerCase() !== "overflow-x") return;
      if (!/\bhidden\b/i.test(decl.value)) return;
      stylelint.utils.report({
        message: messages.rejected,
        node: decl,
        result,
        ruleName,
      });
    });
  });
});

module.exports.ruleName = ruleName;
module.exports.messages = messages;
