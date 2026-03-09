import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import importPlugin from "eslint-plugin-import";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

import getEslintOverrides from "./eslint-overrides.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const silverkey = require(path.join(__dirname, "eslint-plugin-silverkey"));
const clientRoot = path.join(__dirname, "../../..");
const tsconfigAppPath = path.resolve(clientRoot, "packages/config/tsconfig/tsconfig.app.json");

export default tseslint.config(
  // Ignore patterns
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/vite.config.ts",
      "**/postcss.config.js",
      "**/tailwind.config.ts",
      "**/*.md", // Ignore all markdown files
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

  // FAAng-level: max lines + folder extension policy (silverkey plugin)
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { silverkey },
    rules: {
      // Platform variants: prevent ad-hoc imports of .web/.native modules; keep divergence in config/platform/variants.json
      "silverkey/platform-variants-exception-list": [
        "warn",
        {
          allowlist: [],
        },
      ],
      // UI primitives: ensure core primitives (Button, Title, Box, etc.) come from shared UI modules, not ad-hoc feature modules
      "silverkey/require-platform-primitives": [
        "warn",
        {
          primitiveNames: undefined,
        },
      ],
      "silverkey/max-lines-hard": [
        "warn",
        { warnAt: 500, max: 650, ignorePatterns: ["dist/", "build/", "coverage/", ".d.ts"] },
      ],
      "silverkey/folder-extension-policy": [
        "error",
        {
          policies: [
            { folder: "packages/services", allowed: ["ts"] },
            { folder: "packages/schemas", allowed: ["ts"] },
          ],
        },
      ],
      // Allow 15–16 item folders (modals, HomeAuth, hooks/data/auth) to avoid fragmentation; warn at 17+, error at 20+
      "silverkey/folder-max-items": [
        "warn",
        { warnAt: 17, errorAt: 20, skipDirNames: ["Client", "api", "features"] },
      ],
      "silverkey/no-empty-folders": [
        "error",
        {
          excludeDirs: [],
          allowedFiles: [],
          skipDirNames: [],
        },
      ],
      // Package feature modules: only api/, components/, hooks/, store/, types/, utils/, index.ts (enabled only for packages/features below)
      "silverkey/package-module-allowed-children": ["off"],
      "silverkey/no-hardcoded-breakpoints": ["error", { allowedBreakpoints: [] }],
      // Enforce alias-based imports; set to "error" after migrating existing relative parent imports
      "silverkey/no-relative-parent-imports": "warn",
      "silverkey/no-console-logger": [
        "error",
        {
          loggerPath: "logger",
          exceptions: {
            testFiles: true,
            nodeScripts: true,
          },
        },
      ],
      "silverkey/no-process-env-outside-config": [
        "error",
        {
          allowlist: [
            "packages/config/env.ts",
            "vite.config",
            "vitest.config",
            "postcss.config",
            "tailwind.config",
            ".config.js",
            ".config.mjs",
          ],
        },
      ],
      // Features: do not import another feature's components, hooks, utils, store, types, api, services
      "silverkey/no-cross-feature-internals": "error",
    },
  },

  // packages/features: enforce module structure (api, components, hooks, store, types, utils, index.ts, native.ts only)
  {
    files: ["packages/features/**/*.{js,jsx,ts,tsx}"],
    plugins: { silverkey },
    rules: {
      "silverkey/package-module-allowed-children": [
        "error",
        {
          scopeDir: "packages/features",
          allowedRootFiles: [
            "index.ts",
            "index.tsx",
            "index.js",
            "index.native.ts",
            "README.md",
            "native.ts",
          ],
        },
      ],
    },
  },

  // Silence folder-max-items for config files
  {
    files: [
      "packages/config/eslint/eslint.config.js",
      "packages/config/eslint/eslint-overrides.js",
    ],
    plugins: { silverkey },
    rules: { "silverkey/folder-max-items": "off" },
  },

  // packages/api: no any on API response types (API clients live in packages/api/)
  {
    files: ["packages/api/**/*.ts"],
    plugins: { silverkey },
    rules: {
      "silverkey/no-api-any": "error",
    },
  },

  // packages/utils: 16 direct children (index, README, 14 domain folders) after rework; no grouping.
  {
    files: ["packages/utils/**/*.ts"],
    plugins: { silverkey },
    rules: {
      "silverkey/folder-max-items": ["off"],
    },
  },

  // packages/ui/components: 21 direct children (accessibility, adapters, asset, badge, button, cards, etc.); structure intentional.
  {
    files: ["packages/ui/components/**/*.{ts,tsx}"],
    plugins: { silverkey },
    rules: {
      "silverkey/folder-max-items": ["off"],
    },
  },

  // packages/email-templates: script run by Server with cwd=apps/web; relative paths required for runtime resolution.
  {
    files: ["packages/email-templates/**/*.{ts,tsx}"],
    plugins: { silverkey },
    rules: {
      "silverkey/no-relative-parent-imports": "off",
    },
  },

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
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",

      // General rules
      // Note: no-console is replaced by silverkey/no-console-logger which provides better error messages
      "no-debugger": "error",
      // Cap function size and complexity; limits set to avoid file fragmentation (code-organization: prefer complexity over line count)
      "max-lines-per-function": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
      complexity: ["warn", { max: 60 }],
      "silverkey/no-explicit-any-disable-reason": "error",
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

  // Type-aware linting + promise/async safety (only for files in tsconfig.app.json to avoid project-service errors)
  // Import path verification: ensure imports resolve (tsconfig paths, node_modules)
  // no-unimported-identifiers: report identifiers used but not imported (TS semantic diagnostic 2304)
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
            "^@react-email/", // provided by apps/web when email-templates script runs
            "^@headlessui/react$", // in apps/web/package.json; packages/ui adapters use it for web
            "^@expo/vector-icons$", // in apps/mobile/package.json; packages/ui iconMapImpl.native uses it
            "^@react-navigation/native$", // in apps/mobile/package.json; navigation adapter uses it
            // Extensionless relative imports resolved by bundler to .web/.native (e.g. ./Button -> Button.web.tsx; primitives/box/index.ts from "./Box" -> Box.web.tsx)
            "^\\.[/]?[^/]+$",
          ],
        },
      ],
      // Catch require/import cycles (e.g. barrel files) before Metro/runtime
      "import/no-cycle": ["error", { maxDepth: Infinity, ignoreExternal: true }],
    },
  },

  // React-specific configuration: apps/web + packages/features + packages/ui
  {
    files: [
      "apps/web/**/*.{js,jsx,ts,tsx}",
      "packages/features/**/*.{js,jsx,ts,tsx}",
      "packages/ui/**/*.{js,jsx,ts,tsx}",
    ],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      silverkey,
    },
    rules: {
      // React Hooks rules
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "error",

      // React Refresh rules
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // State: no getState() in app/feature UI; use selectors/hooks only
      "silverkey/no-zustand-get-state": "error",
      // Async: no useEffect(async) to avoid setState on unmounted + enforce cancellation
      "silverkey/no-async-use-effect": "error",
    },
  },

  // Overrides: silverkey, apps/web, packages, tests (see eslint-overrides.js)
  ...getEslintOverrides({ silverkey, reactHooks, reactRefresh, jsxA11y }),

  // Prettier config to disable conflicting rules
  prettier
);
