/**
 * Base ESLint configuration: ignores, node globals, JS/TS recommended,
 * global TypeScript + general rules, and import sorting.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

import js from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

export default function getBaseConfig() {
  return [
    {
      ignores: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/coverage/**",
        "**/.turbo/**",
        "**/vite.config.js",
        "**/vite.config.resolve.js",
        "**/vite.config.d.ts",
        "**/postcss.config.js",
        "**/tailwind.config.ts",
        "packages/config/stylelint/**",
        "**/*.md",
      ],
    },

    // Node scripts and tools: allow Node globals (Buffer, process, console)
    {
      files: ["scripts/**/*.mjs"],
      languageOptions: {
        globals: {
          ...globals.node,
        },
      },
    },

    // Base JS recommended rules
    js.configs.recommended,

    // TypeScript recommended rules
    ...tseslint.configs.recommended,

    // Global configuration for all files
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        globals: {
          ...globals.browser,
          ...globals.es2021,
          ...globals.node,
        },
      },
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
          },
        ],
        "@typescript-eslint/no-explicit-any": "error",
        // Note: no-console is replaced by silverkey/no-console-logger
        "no-debugger": "error",
        // Cap function size and complexity; limits set to avoid file fragmentation
        "max-lines-per-function": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
        complexity: ["warn", { max: 60 }],
      },
    },

    // Import sorting: side-effect → node → React → third-party → packages → @/ → rest → relative
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: { "simple-import-sort": simpleImportSort },
      rules: {
        "simple-import-sort/imports": [
          "warn",
          {
            groups: [
              ["^\u0000"],
              ["^node:"],
              ["^react$", "^react-dom$", "^react/"],
              ["^@?\\w"],
              ["^packages/"],
              ["^@/"],
              ["^"],
              ["^\\."],
            ],
          },
        ],
        "simple-import-sort/exports": "warn",
      },
    },

    // Log contract codegen controls export order; do not re-sort generated barrels.
    {
      files: [
        "packages/logger/core/categories.ts",
        "packages/logger/core/categories.generated.ts",
        "packages/logger/config/*.generated.ts",
      ],
      rules: {
        "simple-import-sort/exports": "off",
      },
    },
  ];
}
