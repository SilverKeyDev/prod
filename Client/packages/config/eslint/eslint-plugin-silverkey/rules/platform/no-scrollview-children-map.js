/**
 * Warn when ScrollView wraps a direct `.map()` over a non-constant list.
 * Skips ALL_CAPS constant arrays and inline ArrayExpressions.
 * Short lists (≤12 items) are allowed — chips, agenda rows, date pickers.
 */

const MAX_SHORT_LIST_MAP_LENGTH = 12;

function isScrollViewish(nameNode) {
  if (!nameNode) return false;
  if (nameNode.type === "JSXIdentifier") return nameNode.name === "ScrollView";
  if (nameNode.type === "JSXMemberExpression" && nameNode.property?.type === "JSXIdentifier") {
    return nameNode.property.name === "ScrollView";
  }
  return false;
}

function isConstantArrayName(name) {
  return /^[A-Z][A-Z0-9_]*$/.test(name);
}

function isProbablyStaticMap(callExpr) {
  const obj = callExpr.callee?.object;
  if (!obj) return true;
  if (obj.type === "ArrayExpression") {
    return obj.elements.length <= MAX_SHORT_LIST_MAP_LENGTH;
  }
  if (obj.type === "Literal" && typeof obj.value === "string") return true;
  if (obj.type === "Identifier") return isConstantArrayName(obj.name);
  if (obj.type === "MemberExpression" && obj.property?.type === "Identifier") {
    return isConstantArrayName(obj.property.name);
  }
  return false;
}

function findMapCallInExpression(expr) {
  if (!expr) return null;
  if (
    expr.type === "CallExpression" &&
    expr.callee?.type === "MemberExpression" &&
    expr.callee.property?.type === "Identifier" &&
    expr.callee.property.name === "map"
  ) {
    return expr;
  }
  if (expr.type === "LogicalExpression") {
    return findMapCallInExpression(expr.right) || findMapCallInExpression(expr.left);
  }
  if (expr.type === "ConditionalExpression") {
    return findMapCallInExpression(expr.consequent) || findMapCallInExpression(expr.alternate);
  }
  return null;
}

function walkJsxChildForMap(child) {
  if (!child) return null;
  if (child.type === "JSXExpressionContainer" && child.expression) {
    const m = findMapCallInExpression(child.expression);
    if (m) return m;
  }
  return null;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Suggest FlatList when ScrollView children map over dynamic data, for virtualization and memory.",
    },
    schema: [],
    messages: {
      preferFlatList:
        "Mapping an array inside ScrollView can hurt performance for long lists — prefer FlatList/SectionList (or ensure the list is short).",
    },
  },

  create(context) {
    return {
      JSXElement(node) {
        if (!isScrollViewish(node.openingElement?.name)) return;
        for (const child of node.children) {
          const mapCall = walkJsxChildForMap(child);
          if (!mapCall || isProbablyStaticMap(mapCall)) continue;
          context.report({ node: mapCall, messageId: "preferFlatList" });
        }
      },
    };
  },
};
