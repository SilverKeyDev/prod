// Patterns to detect hardcoded breakpoints (475px xs, 640px sm, 768px md, 1024px lg, 1280px xl)
const BREAKPOINT_PATTERNS = [
  /\(max-width:\s*76[0-9]px\)/i,
  /\(min-width:\s*76[0-9]px\)/i,
  /\(max-width:\s*64[0-9]px\)/i,
  /\(min-width:\s*64[0-9]px\)/i,
  /\(max-width:\s*102[0-9]px\)/i,
  /\(min-width:\s*102[0-9]px\)/i,
  /\(max-width:\s*128[0-9]px\)/i,
  /\(min-width:\s*128[0-9]px\)/i,
  /\(max-width:\s*47[0-9]px\)/i,
  /\(min-width:\s*47[0-9]px\)/i,
];

function isHardcodedBreakpoint(str, allowedBreakpoints) {
  if (!str || typeof str !== "string") return false;
  if (allowedBreakpoints.includes(str)) return false;
  return BREAKPOINT_PATTERNS.some((p) => p.test(str));
}

function isStandardizedBreakpointUsage(node) {
  if (
    node.type === "CallExpression" &&
    (node.callee.name === "screenDown" || node.callee.name === "screenUp")
  ) {
    return true;
  }
  if (
    node.type === "CallExpression" &&
    typeof node.callee.name === "string" &&
    (node.callee.name === "useIsMobile" ||
      node.callee.name === "useResponsive" ||
      node.callee.name === "useMediaQuery")
  ) {
    return true;
  }
  return false;
}

function checkStringLiteral(context, node, allowedBreakpoints) {
  if (node.type !== "Literal" || typeof node.value !== "string") return;
  if (isHardcodedBreakpoint(node.value, allowedBreakpoints)) {
    context.report({ node, messageId: "hardcodedBreakpoint" });
  }
}

function checkTemplateLiteral(context, node, allowedBreakpoints) {
  if (node.type !== "TemplateLiteral") return;
  node.quasis.forEach((quasi) => {
    const cooked = quasi.value?.cooked;
    if (isHardcodedBreakpoint(cooked, allowedBreakpoints)) {
      context.report({ node: quasi, messageId: "hardcodedBreakpoint" });
    }
  });
}

function checkMatchMediaCall(context, node, allowedBreakpoints) {
  if (
    node.type !== "CallExpression" ||
    node.callee.type !== "MemberExpression" ||
    node.callee.object.name !== "window" ||
    node.callee.property.name !== "matchMedia"
  ) {
    return;
  }
  if (node.arguments.length === 0) return;
  const arg = node.arguments[0];
  if (isStandardizedBreakpointUsage(arg)) return;
  if (arg.type === "Literal" && typeof arg.value === "string") {
    if (isHardcodedBreakpoint(arg.value, allowedBreakpoints)) {
      context.report({ node: arg, messageId: "hardcodedMatchMedia" });
    }
  }
  if (arg.type === "TemplateLiteral") {
    checkTemplateLiteral(context, arg, allowedBreakpoints);
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded breakpoint values. Use standardized utilities: screenDown('md'), screenUp('md'), or useIsMobile() hook.",
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedBreakpoints: {
            type: "array",
            items: { type: "string" },
            description: "List of allowed hardcoded breakpoint strings (for exceptions)",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcodedBreakpoint:
        "Use standardized breakpoint utilities: screenDown('md'), screenUp('md'), or useIsMobile() hook instead of hardcoded breakpoints.",
      hardcodedMatchMedia:
        "Use standardized breakpoint utilities with window.matchMedia. Import screenDown or screenUp from 'packages/schemas/app/ui/screens'.",
    },
  },

  create(context) {
    const opt = context.options[0] || {};
    const allowedBreakpoints = opt.allowedBreakpoints || [];

    return {
      Literal(node) {
        checkStringLiteral(context, node, allowedBreakpoints);
      },
      TemplateLiteral(node) {
        checkTemplateLiteral(context, node, allowedBreakpoints);
      },
      CallExpression(node) {
        checkMatchMediaCall(context, node, allowedBreakpoints);
      },
    };
  },
};
