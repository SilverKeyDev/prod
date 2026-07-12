/**
 * Type-aware ESLint configuration: promise/async safety, import path
 * verification, and import cycle detection for app + shared packages.
 * @param {{ silverkey: object }} plugins
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import importPlugin from "eslint-plugin-import";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, "../../../..");
const tsconfigAppPath = path.resolve(clientRoot, "packages/config/tsconfig/tsconfig.app.json");

export default function getTypeAwareConfig({ silverkey }) {
  return [
    {
      files: [
        "apps/web/**/*.{ts,tsx}",
        "packages/contexts/**/*.{ts,tsx}",
        "packages/design-tokens/**/*.{ts,tsx}",
        "packages/email-templates/**/*.{ts,tsx}",
        "packages/features/**/*.{ts,tsx}",
        "packages/hooks/**/*.{ts,tsx}",
        "packages/navigation/**/*.{ts,tsx}",
        "packages/schemas/**/*.{ts,tsx}",
        "packages/services/**/*.{ts,tsx}",
        "packages/store/**/*.{ts,tsx}",
        "packages/ui/**/*.{ts,tsx}",
        "packages/utils/**/*.{ts,tsx}",
      ],
      plugins: { import: importPlugin, silverkey },
      settings: {
        "import/resolver": {
          typescript: {
            project: tsconfigAppPath,
            alwaysTryTypes: true,
          },
          node: true,
        },
      },
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: clientRoot,
          allowDefaultProject: true,
        },
      },
      rules: {
        "@typescript-eslint/no-floating-promises": "warn",
        "@typescript-eslint/await-thenable": "error",
        "silverkey/no-unimported-identifiers": "error",
        "import/no-unresolved": [
          "error",
          {
            commonjs: true,
            caseSensitive: true,
            ignore: [
              "\\.(png|jpg|jpeg|gif|svg|webp)(\\?.*)?$",
              "^/.*\\.(png|jpg|jpeg|gif|svg|webp)(\\?.*)?$",
              "^@react-email/",
              "^@headlessui/react$",
              "^@expo/vector-icons$",
              "^@react-navigation/native$",
              "^expo-blur$",
              "^expo-linear-gradient$",
              // Extensionless relative imports resolved by bundler to .web/.native
              "^\\.[/]?[^/]+$",
              // Platform pair PdfModalBridge.web.tsx / PdfModalBridge.native.tsx
              "^packages/features/documents/components/pdf/PdfModalBridge$",
              // Vite virtual module from apps/web/vite.plugin.wiki.js
              "^virtual:silverkey-wiki$",
            ],
          },
        ],
        // Catch require/import cycles (e.g. barrel files) before Metro/runtime
        "import/no-cycle": ["error", { maxDepth: Infinity, ignoreExternal: true }],
      },
    },
  ];
}
