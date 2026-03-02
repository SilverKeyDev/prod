"use strict";

const path = require("path");

/**
 * In packages/features and apps/web/pages, require importing UI from @ui
 * instead of relative paths to components/ui.
 */
module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "In features and pages, import UI components from '@ui' instead of relative paths to components/ui.",
    },
    schema: [],
    messages: {
      useUiAlias:
        "Import from '@ui' instead of relative path to components/ui. Example: import { Button } from '@ui'",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");

    const inFeatures = filename.includes("packages/features/");
    const inPages = filename.includes("apps/web/pages/");
    if (!inFeatures && !inPages) return {};

    return {
      ImportDeclaration(node) {
        const source = node.source.value;
        if (!source.startsWith(".")) return;

        // Relative import that likely points to components/ui
        // e.g. ../ui, ../../components/ui, ../components/ui
        const looksLikeUi =
          source === "../ui" ||
          source === "../../ui" ||
          source.endsWith("/ui") ||
          source.includes("components/ui");
        if (!looksLikeUi) return;

        context.report({
          node: node.source,
          messageId: "useUiAlias",
        });
      },
    };
  },
};
