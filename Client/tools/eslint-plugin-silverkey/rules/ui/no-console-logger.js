module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce centralized logging: ban console.* methods in favor of the centralized logger utility.",
    },
    schema: [
      {
        type: "object",
        properties: {
          loggerPath: {
            type: "string",
          },
          exceptions: {
            type: "object",
            properties: {
              testFiles: { type: "boolean" },
              nodeScripts: { type: "boolean" },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      useLogger:
        "Use the centralized logger instead of console.{{method}}. Import: import { log, LOG_CATEGORIES } from '../../logger' (adjust path as needed). Example: log.info(LOG_CATEGORIES.API, 'message', data)",
    },
  },

  create(context) {
    const filename = context.getFilename();
    const opt = context.options[0] || {};
    const _loggerPath = opt.loggerPath || "logger";
    const exceptions = opt.exceptions || {
      testFiles: true,
      nodeScripts: true,
    };

    // Allow in test files
    if (
      exceptions.testFiles &&
      (filename.includes(".test.") || filename.includes(".spec."))
    ) {
      return {};
    }

    // Allow in Node scripts
    if (
      exceptions.nodeScripts &&
      (filename.includes("scripts/") || filename.includes("tools/"))
    ) {
      return {};
    }

    // Only apply to TypeScript/JavaScript files in Client directory
    // filename is typically absolute path, so check for Client/ in path
    if (!filename.includes("Client/") && !filename.includes("/Client/")) {
      return {};
    }

    return {
      MemberExpression(node) {
        // Check for console.log, console.info, console.warn, console.error
        if (
          node.object &&
          node.object.name === "console" &&
          node.property &&
          ["log", "info", "warn", "error", "debug"].includes(node.property.name)
        ) {
          context.report({
            node,
            messageId: "useLogger",
            data: {
              method: node.property.name,
            },
          });
        }
      },
    };
  },
};
