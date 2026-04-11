/**
 * ESLint rule: no-dynamic-class-names
 * Disallow dynamic Tailwind class names (e.g. cn(`text-${color}`)) in favor of static cn() or safelist.
 * Dynamic class construction prevents PurgeCSS from detecting which classes to keep.
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer static Tailwind class names over dynamic construction. Use cn() with static strings or add to safelist.",
      category: "Best Practices",
      recommended: true,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedPatterns: {
            type: "array",
            items: { type: "string" },
            description:
              "Array of regex patterns for allowed dynamic class constructions",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      dynamicClassName:
        "Avoid dynamic Tailwind class construction '{{pattern}}'. Use static classes with cn() or add to safelist in tailwind.config.",
      templateLiteralInClassName:
        "Template literal with expressions in className/class prop. Use static strings or cn() with conditionals instead.",
      stringConcatInClassName:
        "String concatenation in className/class prop. Use static strings or cn() with conditionals instead.",
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const allowedPatterns = (options.allowedPatterns || []).map(
      (p) => new RegExp(p),
    );

    // Patterns that indicate dynamic class construction
    const TAILWIND_PREFIX_PATTERN =
      /\b(bg|text|border|p|m|w|h|flex|grid|gap|rounded|shadow|opacity|scale|translate|rotate|skew|font|leading|tracking|space|divide|ring|inset|top|bottom|left|right|z)-/;

    function isAllowed(value) {
      return allowedPatterns.some((pattern) => pattern.test(value));
    }

    function checkTemplateLiteral(node, _propName) {
      // Check if template literal has expressions (e.g., `text-${color}`)
      if (node.expressions && node.expressions.length > 0) {
        const source = context.getSourceCode().getText(node);

        // Check if it contains Tailwind-like patterns
        if (TAILWIND_PREFIX_PATTERN.test(source) && !isAllowed(source)) {
          context.report({
            node,
            messageId: "templateLiteralInClassName",
            data: {
              pattern: source.slice(0, 50) + (source.length > 50 ? "..." : ""),
            },
          });
        }
      }
    }

    function checkBinaryExpression(node, _propName) {
      // Check for string concatenation (e.g., "text-" + color)
      if (node.operator === "+") {
        const source = context.getSourceCode().getText(node);

        if (TAILWIND_PREFIX_PATTERN.test(source) && !isAllowed(source)) {
          context.report({
            node,
            messageId: "stringConcatInClassName",
            data: {
              pattern: source.slice(0, 50) + (source.length > 50 ? "..." : ""),
            },
          });
        }
      }
    }

    function checkCallExpression(node) {
      // Check cn() or clsx() calls with template literals
      const callee = node.callee;
      const isCnCall =
        (callee.type === "Identifier" &&
          (callee.name === "cn" || callee.name === "clsx")) ||
        (callee.type === "MemberExpression" &&
          callee.property &&
          (callee.property.name === "cn" || callee.property.name === "clsx"));

      if (isCnCall) {
        node.arguments.forEach((arg) => {
          if (arg.type === "TemplateLiteral") {
            checkTemplateLiteral(arg, "cn");
          } else if (arg.type === "BinaryExpression") {
            checkBinaryExpression(arg, "cn");
          }
        });
      }
    }

    function checkJSXAttribute(node) {
      const attrName = node.name && node.name.name;
      if (attrName !== "className" && attrName !== "class") {
        return;
      }

      const value = node.value;
      if (!value) return;

      // Check JSX expression container
      if (value.type === "JSXExpressionContainer") {
        const expr = value.expression;

        if (expr.type === "TemplateLiteral") {
          checkTemplateLiteral(expr, attrName);
        } else if (expr.type === "BinaryExpression") {
          checkBinaryExpression(expr, attrName);
        } else if (expr.type === "CallExpression") {
          checkCallExpression(expr);
        }
      }
    }

    return {
      JSXAttribute: checkJSXAttribute,
      CallExpression: checkCallExpression,
    };
  },
};
