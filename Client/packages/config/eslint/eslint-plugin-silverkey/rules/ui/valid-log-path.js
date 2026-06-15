"use strict";

/**
 * Static LogPath literals in log.* calls must match LOG_PATHS from categories.yaml codegen.
 */

const fs = require("fs");
const path = require("path");

const LOG_METHODS = new Set(["debug", "info", "warn", "error", "security"]);
const PATH_SHAPE = /^[A-Z][A-Z0-9_]+(\.[A-Z][A-Z0-9_]+)*$/;

const GENERATED_PATH = path.join(__dirname, "../../../../../logger/core/categories.generated.ts");

let cachedLogPaths = null;

function loadLogPaths() {
  if (cachedLogPaths) {
    return cachedLogPaths;
  }
  let content;
  try {
    content = fs.readFileSync(GENERATED_PATH, "utf8");
  } catch {
    throw new Error(
      `valid-log-path: missing ${GENERATED_PATH}; run make log-contracts from repo root.`
    );
  }
  const block = content.match(/export const LOG_PATHS = \[([\s\S]*?)\] as const/);
  if (!block) {
    throw new Error("valid-log-path: LOG_PATHS not found in categories.generated.ts");
  }
  const paths = [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  cachedLogPaths = new Set(paths);
  return cachedLogPaths;
}

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

function staticLogPathFromArg(firstArg) {
  if (!firstArg) {
    return null;
  }
  if (firstArg.type === "Literal" && typeof firstArg.value === "string") {
    return firstArg.value;
  }
  if (
    firstArg.type === "TemplateLiteral" &&
    firstArg.expressions.length === 0 &&
    firstArg.quasis.length === 1
  ) {
    return firstArg.quasis[0].value.cooked;
  }
  return null;
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require static LogPath literals in log calls to match LOG_PATHS from log contract codegen.",
    },
    schema: [],
    messages: {
      unknownLogPath:
        'Unknown LogPath "{{path}}". Add the category in scripts/log_contracts/categories.yaml and run make log-contracts.',
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

    let logPaths;
    try {
      logPaths = loadLogPaths();
    } catch (error) {
      return {
        Program(node) {
          context.report({ node, message: String(error) });
        },
      };
    }

    return {
      CallExpression(node) {
        if (!isLogCall(node.callee)) {
          return;
        }

        const pathLiteral = staticLogPathFromArg(node.arguments[0]);
        if (!pathLiteral || !PATH_SHAPE.test(pathLiteral)) {
          return;
        }

        if (!logPaths.has(pathLiteral)) {
          context.report({
            node: node.arguments[0],
            messageId: "unknownLogPath",
            data: { path: pathLiteral },
          });
        }
      },
    };
  },
};
