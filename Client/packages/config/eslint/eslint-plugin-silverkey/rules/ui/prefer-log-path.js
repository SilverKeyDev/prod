"use strict";

/**
 * Prefer dot-notation LogPath strings over LOG_CATEGORIES enum / API_SUBCATEGORIES 4th arg.
 */

const LOG_METHODS = new Set(["debug", "info", "warn", "error", "security"]);

function isLoggerPackageFile(filename) {
  return filename.includes("/packages/logger/") || filename.endsWith("/packages/logger.ts");
}

function isLogCall(callee) {
  if (callee.type !== "MemberExpression" || callee.property.type !== "Identifier") {
    return false;
  }
  if (!LOG_METHODS.has(callee.property.name)) {
    return false;
  }
  const obj = callee.object;
  return obj.type === "Identifier" && obj.name === "log";
}

function isLogCategoriesReference(node) {
  return (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "LOG_CATEGORIES"
  );
}

function isApiSubcategoriesReference(node) {
  return (
    node.type === "MemberExpression" &&
    node.object.type === "Identifier" &&
    node.object.name === "API_SUBCATEGORIES"
  );
}

function isApiCategoryFirstArg(firstArg) {
  if (!firstArg) {
    return false;
  }
  if (firstArg.type === "Literal" && firstArg.value === "API") {
    return true;
  }
  if (
    firstArg.type === "TemplateLiteral" &&
    firstArg.expressions.length === 0 &&
    firstArg.quasis.length === 1 &&
    firstArg.quasis[0].value.cooked === "API"
  ) {
    return true;
  }
  return false;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        'Prefer dot-notation LogPath strings (e.g. "AUTH", "API.POLLING") instead of LOG_CATEGORIES or API_SUBCATEGORIES in log calls.',
    },
    schema: [],
    messages: {
      noLogCategories:
        'Do not pass LOG_CATEGORIES.* to log methods; use a LogPath string (e.g. log.info("AUTH", message, data)).',
      preferApiLogPath:
        "Use a single LogPath for API subcategories (e.g. log.info(`API.${subcategory}`, message, data)) instead of a 4th API_SUBCATEGORIES argument.",
    },
  },

  create(context) {
    const filename = context.getFilename();

    if (isLoggerPackageFile(filename)) {
      return {};
    }

    if (filename.includes(".test.") || filename.includes(".spec.")) {
      return {};
    }

    return {
      CallExpression(node) {
        if (!isLogCall(node.callee)) {
          return;
        }

        const [firstArg, , , fourthArg] = node.arguments;

        if (firstArg && isLogCategoriesReference(firstArg)) {
          context.report({ node: firstArg, messageId: "noLogCategories" });
          return;
        }

        if (!fourthArg) {
          return;
        }

        if (isApiSubcategoriesReference(fourthArg) && isApiCategoryFirstArg(firstArg)) {
          context.report({ node: fourthArg, messageId: "preferApiLogPath" });
          return;
        }

        if (
          fourthArg.type === "Identifier" &&
          isApiCategoryFirstArg(firstArg) &&
          fourthArg.name !== "undefined"
        ) {
          context.report({ node: fourthArg, messageId: "preferApiLogPath" });
        }
      },
    };
  },
};
