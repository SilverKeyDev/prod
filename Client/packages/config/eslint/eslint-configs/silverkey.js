/**
 * SilverKey plugin ESLint rules: main rule set, packages/features enforcement,
 * and per-folder/per-file silverkey suppressions.
 * @param {{ silverkey: object }} plugins
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

export default function getSilverkeyConfig({ silverkey }) {
  return [
    // FAAng-level: max lines + folder extension policy + all silverkey rules
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: { silverkey },
      rules: {
        // Platform variants: prevent ad-hoc imports of .web/.native modules
        "silverkey/platform-variants-exception-list": ["warn", { allowlist: [] }],
        // UI primitives: ensure core primitives come from shared UI modules
        "silverkey/require-platform-primitives": ["warn", { primitiveNames: undefined }],
        "silverkey/max-lines-hard": [
          "warn",
          {
            warnAt: 500,
            max: 650,
            ignorePatterns: ["dist/", "build/", "coverage/", ".d.ts"],
          },
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
        // Allow 15–16 item folders (modals, HomeAuth, hooks/data/auth) to avoid fragmentation
        "silverkey/folder-max-items": [
          "warn",
          {
            warnAt: 17,
            errorAt: 20,
            skipDirNames: ["Client", "api", "features", "config", "packages"],
          },
        ],
        "silverkey/no-empty-folders": [
          "error",
          {
            excludeDirs: [],
            allowedFiles: [],
            skipDirNames: [],
          },
        ],
        // Package feature modules: only api/, components/, hooks/, store/, types/, utils/, index.ts
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
        "silverkey/no-secure-logger": "error",
        "silverkey/prefer-log-path": "error",
        "silverkey/valid-log-path": "error",
        "silverkey/no-unsafe-innerhtml": "error",
        "silverkey/no-raw-translation-key-literal": [
          "warn",
          {
            translationCalleeNames: ["t", "formatMessage"],
            exemptCalleeNames: ["color"],
            ignoredFirstSegments: ["brand", "neutral"],
          },
        ],
        "silverkey/no-direct-api-error-field": "warn",
        "silverkey/no-process-env-outside-config": [
          "error",
          {
            allowlist: [
              "packages/config/env.ts",
              "packages/logger/config/loggerEnv.ts",
              "vite.config",
              "vitest.config",
              "postcss.config",
              "tailwind.config",
              ".config.js",
              ".config.mjs",
            ],
            exceptions: {
              testFiles: true,
            },
          },
        ],
        "silverkey/no-explicit-any-disable-reason": "error",
        "silverkey/primitives-justification": "error",
        "silverkey/variants-justification": "error",
        "silverkey/layouts-justification": "error",
      },
    },

    // packages/features: enforce module structure
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
        // Utility consolidation: warn on value imports from another feature's utils/
        "silverkey/no-cross-feature-utils-imports": ["warn"],
      },
    },

    // Silence folder-max-items + max-lines for heavy eslint config files
    {
      files: [
        "packages/config/eslint/eslint.config.js",
        "packages/config/eslint/eslint-overrides.js",
        "packages/config/eslint/eslint-configs/*.js",
      ],
      plugins: { silverkey },
      rules: {
        "silverkey/folder-max-items": "off",
        "silverkey/max-lines-hard": "off",
      },
    },
    // ESLint plugin rule files live in a flat folder; suppress folder count noise
    {
      files: ["packages/config/eslint/eslint-plugin-silverkey/rules/ui/*.js"],
      plugins: { silverkey },
      rules: { "silverkey/folder-max-items": "off" },
    },
    {
      files: ["packages/features/search/components/header/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: { "silverkey/folder-max-items": "off" },
    },
    {
      files: ["packages/ui/styles/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: { "silverkey/folder-max-items": "off" },
    },

    // CJS config files (Tailwind preset for Metro/Node) require require()
    {
      files: ["packages/config/**/*.cjs.js", "packages/config/**/*.cjs"],
      rules: { "@typescript-eslint/no-require-imports": "off" },
    },

    // packages/api: no any on API response types
    {
      files: ["packages/api/**/*.ts"],
      plugins: { silverkey },
      rules: {
        "silverkey/no-api-any": "error",
      },
    },

    // packages/ui/components: 8 meta-folder direct children (inputs, actions, surfaces, structure, media, system)

    // packages/email-templates: relative paths required for runtime resolution
    {
      files: ["packages/email-templates/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: {
        "silverkey/no-relative-parent-imports": "off",
      },
    },
  ];
}
