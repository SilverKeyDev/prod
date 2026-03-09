"use strict";

const fs = require("fs");
const path = require("path");

function loadAllowedModules() {
  try {
    const primitivesPath = path.join(__dirname, "../../../../platform/primitives.json");
    const raw = fs.readFileSync(primitivesPath, "utf8");
    const primitives = JSON.parse(raw);
    const modules = new Set();

    if (Array.isArray(primitives)) {
      for (const primitive of primitives) {
        if (primitive && typeof primitive.module === "string" && primitive.module.length > 0) {
          modules.add(primitive.module);
        }
      }
    }

    return modules;
  } catch {
    // If config is missing or invalid, fall back to empty set so the rule is effectively disabled.
    return new Set();
  }
}

const allowedModules = loadAllowedModules();

const DEFAULT_PRIMITIVE_NAMES = [
  // Layout + text primitives
  "Box",
  "Text",
  "ScrollView",
  // Core UI primitives
  "Button",
  "IconButton",
  "NavigationButton",
  "NavigationButtons",
  // Form primitives
  "Input",
  "PhoneInput",
  // Typography
  "Title",
  "Subtitle",
  "BodyText",
  "Label",
  // Media
  "Image",
  "Video",
];

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ensure core UI primitives (Button, Text, Box, etc.) are imported from the shared UI modules listed in config/platform/primitives.json, not ad-hoc feature modules.",
    },
    schema: [
      {
        type: "object",
        properties: {
          primitiveNames: {
            type: "array",
            items: { type: "string" },
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      requirePrimitiveModule:
        "Primitive '{{name}}' must be imported from one of the shared UI modules ({{allowed}}) defined in config/platform/primitives.json, not '{{importPath}}'.",
    },
  },

  create(context) {
    const rawFilename = context.getFilename();
    const filename = rawFilename.split(path.sep).join("/");
    const opt = context.options[0] || {};
    const primitiveNames = new Set(opt.primitiveNames || DEFAULT_PRIMITIVE_NAMES);
    const isIconMapImplFile = filename.includes("packages/ui/components/icons/iconMapImpl");

    // Apply to app layers and feature/UI packages where primitives are consumed.
    const inRelevantFile =
      filename.includes("apps/web/") ||
      filename.includes("apps/mobile/") ||
      filename.includes("packages/features/") ||
      filename.includes("packages/ui/components/");

    if (!inRelevantFile) {
      return {};
    }

    // Do not enforce inside the primitives implementation folder itself.
    if (filename.includes("packages/ui/components/primitives")) {
      return {};
    }

    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;

        const importPath = typeof node.source.value === "string" ? node.source.value : null;
        if (!importPath) return;

        // Special-case: allow icon primitives to be imported from lucide icon
        // libraries inside the icon map implementation files, which centralize
        // icon mappings for the UI layer on both web and native.
        if (
          isIconMapImplFile &&
          (importPath === "lucide-react" || importPath === "lucide-react-native")
        ) {
          return;
        }

        // If this is already coming from an allowed module, it's fine.
        if (allowedModules.has(importPath)) {
          return;
        }

        const specifiers = node.specifiers || [];
        for (const specifier of specifiers) {
          if (specifier.type !== "ImportSpecifier") continue;

          const importedName = specifier.imported && specifier.imported.name;
          if (!importedName) continue;

          if (!primitiveNames.has(importedName)) continue;

          const allowedList =
            Array.from(allowedModules).sort().join(", ") || "no configured modules";

          context.report({
            node: node.source,
            messageId: "requirePrimitiveModule",
            data: {
              name: importedName,
              importPath,
              allowed: allowedList,
            },
          });
        }
      },
    };
  },
};
