module.exports = {
  meta: {
    type: "problem",
    docs: {
      description: "Ban imports from the retired secureLogger module; use packages/logger instead.",
    },
    schema: [],
    messages: {
      useCentralLogger:
        'Use the centralized logger instead of secureLogger. Import: import { log } from "packages/logger". Example: log.info("AUTH", "message", data)',
    },
  },

  create(context) {
    const filename = context.getFilename();

    if (!filename.includes("Client/") && !filename.includes("/Client/")) {
      return {};
    }

    const bannedPatterns = [
      /packages\/services\/security\/secureLogger/,
      /services\/security\/secureLogger/,
      /\/secureLogger(?:\.ts)?$/,
    ];

    function isBannedSource(value) {
      if (typeof value !== "string") {
        return false;
      }
      return bannedPatterns.some((pattern) => pattern.test(value));
    }

    return {
      ImportDeclaration(node) {
        if (isBannedSource(node.source.value)) {
          context.report({ node: node.source, messageId: "useCentralLogger" });
        }
      },
      ExportNamedDeclaration(node) {
        if (node.source && isBannedSource(node.source.value)) {
          context.report({ node: node.source, messageId: "useCentralLogger" });
        }
      },
      ExportAllDeclaration(node) {
        if (isBannedSource(node.source.value)) {
          context.report({ node: node.source, messageId: "useCentralLogger" });
        }
      },
    };
  },
};
