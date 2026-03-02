"use strict";

const path = require("path");

/**
 * In apps/web/pages, disallow standalone .ts files. Logic belongs in packages/utils
 * (or packages/hooks, packages/schemas); only .tsx and barrel index.ts are allowed.
 */
module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow standalone .ts files under apps/web/pages. Move logic to packages/utils (or hooks/schemas); use .tsx or barrel index.ts only.",
    },
    schema: [],
    messages: {
      noStandaloneTs:
        "Standalone .ts files are not allowed under apps/web/pages. Move logic to packages/utils/ (or packages/hooks, packages/schemas) or use a barrel index.ts that only re-exports.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    if (!filename.includes("apps/web/pages/")) return {};
    if (!filename.endsWith(".ts")) return {};
    const basename = path.basename(rawFilename);
    if (basename === "index.ts") return {};

    return {
      Program(node) {
        context.report({
          node,
          messageId: "noStandaloneTs",
        });
      },
    };
  },
};
