/**
 * ESLint flat config overrides (silverkey, apps/web, packages, tests).
 * Imported by eslint.config.js to keep the main config under the line limit.
 * @param {{ silverkey: object, reactHooks: object, reactRefresh: object, jsxA11y: object }} plugins
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

const SHARED_PACKAGE_FILES = [
  "packages/config/**/*.{js,jsx,ts,tsx}",
  "packages/contexts/**/*.{js,jsx,ts,tsx}",
  "packages/features/**/*.{js,jsx,ts,tsx}",
  "packages/hooks/**/*.{js,jsx,ts,tsx}",
  "packages/schemas/**/*.{js,jsx,ts,tsx}",
  "packages/services/**/*.{js,jsx,ts,tsx}",
  "packages/store/**/*.{js,jsx,ts,tsx}",
  "packages/ui/**/*.{js,jsx,ts,tsx}",
  "packages/utils/**/*.{js,jsx,ts,tsx}",
];

/** Shared packages: ban platform-leaky globals for RN safety. */
function sharedPackagesRestrictedGlobals() {
  return [
    {
      files: SHARED_PACKAGE_FILES,
      rules: {
        "no-restricted-globals": [
          "warn",
          {
            name: "fetch",
            message: "Use apiClient (config/api or services/http) instead of direct fetch.",
          },
          {
            name: "localStorage",
            message:
              "Do not use localStorage in shared packages; it is not available in React Native. Use a platform abstraction or pass storage as a dependency.",
          },
          {
            name: "sessionStorage",
            message:
              "Do not use sessionStorage in shared packages; it is not available in React Native.",
          },
          {
            name: "navigator",
            message:
              "Do not use navigator in shared packages; it is not available in React Native.",
          },
          {
            name: "document",
            message: "Do not use document in shared packages; it is not available in React Native.",
          },
          {
            name: "window",
            message: "Do not use window in shared packages; it is not available in React Native.",
          },
          {
            name: "File",
            message: "Do not use global File in shared packages; behavior differs in React Native.",
          },
          {
            name: "Blob",
            message: "Do not use global Blob in shared packages; behavior differs in React Native.",
          },
          {
            name: "IntersectionObserver",
            message:
              "Do not use IntersectionObserver in shared packages; it is not available in React Native.",
          },
        ],
      },
    },
  ];
}

/** jsx-a11y for apps/web, packages/contexts, packages/hooks, packages/features, packages/ui. */
function a11yOverrides(jsxA11y) {
  return [
    {
      files: [
        "apps/web/**/*.{js,jsx,ts,tsx}",
        "packages/contexts/**/*.{js,jsx,ts,tsx}",
        "packages/features/**/*.{js,jsx,ts,tsx}",
        "packages/hooks/**/*.{js,jsx,ts,tsx}",
        "packages/ui/**/*.{js,jsx,ts,tsx}",
      ],
      plugins: { "jsx-a11y": jsxA11y },
      rules: { ...jsxA11y.configs.recommended.rules },
    },
  ];
}

/** apps/web: error on direct fetch. */
function appsWebFetchOverride() {
  return [
    {
      files: ["apps/web/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-globals": [
          "error",
          {
            name: "fetch",
            message: "Use apiClient (config/api or services/http) instead of direct fetch.",
          },
        ],
      },
    },
  ];
}

/** Silverkey rules for packages/ui, packages/features, apps/web pages, and shared (no-hardcoded-jsx, no-native-date, etc.). */
function silverkeyComponentsAndFeatures(silverkey) {
  return [
    {
      files: [
        "packages/ui/**/*.{ts,tsx}",
        "packages/features/**/*.{ts,tsx}",
        "apps/web/**/*.{ts,tsx}",
        "apps/mobile/**/*.{ts,tsx}",
      ],
      plugins: { silverkey },
      rules: {
        "silverkey/no-restricted-imports-architecture": [
          "error",
          {
            forbidden: ["packages/services/**", "packages/config/api", "packages/config/api/**"],
            allowedExceptions: ["packages/services/http/**", "packages/services/security/**"],
            // In packages/features, only api/ and services/ may import config/api or services; hooks/components/utils must use feature api layer.
            allowedPathsInFeatures: ["/api/", "/services/"],
            loggerPath: "logger",
          },
        ],
      },
    },
    {
      files: ["packages/features/**/*.{ts,tsx}", "apps/web/pages/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: { "silverkey/require-ui-alias": "warn" },
    },
    {
      files: ["apps/web/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: {
        "silverkey/no-native-date": [
          "warn",
          {
            allowedPaths: [
              "packages/utils/date/",
              "packages/utils/calendar/",
              "packages/config/eslint/eslint-plugin-silverkey/",
              "logger/",
            ],
          },
        ],
      },
    },
    {
      files: ["packages/features/**/*.{ts,tsx}", "apps/web/pages/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: {
        "silverkey/no-direct-accessibility-props": [
          "error",
          { allowedInPaths: ["packages/ui/components/ui/"] },
        ],
      },
    },
    {
      files: ["apps/web/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: { "silverkey/no-platform-feature-check": "warn" },
    },
    // React-specific / platform libraries only in adapter paths (use packages/ui adapters for RN parity)
    {
      files: [
        "packages/ui/**/*.{ts,tsx}",
        "packages/features/**/*.{ts,tsx}",
        "apps/web/**/*.{ts,tsx}",
      ],
      plugins: { silverkey },
      rules: {
        "silverkey/no-direct-platform-libraries": [
          "warn",
          {
            restrictedPackages: [
              "framer-motion",
              "@headlessui/react",
              "react-virtuoso",
              "embla-carousel-react",
              "hls.js",
              "react-phone-number-input",
            ],
            allowedPaths: ["**/adapters/**", "**/form/PhoneInput/**"],
            allowTypeOnlyImports: true,
          },
        ],
      },
    },
    {
      files: [
        "packages/ui/**/*.{ts,tsx}",
        "packages/features/**/*.{ts,tsx}",
        "apps/web/pages/**/*.{ts,tsx}",
      ],
      plugins: { silverkey },
      rules: {
        "silverkey/no-primitive-components": [
          "error",
          {
            primitives: [
              "button",
              "a",
              "span",
              "img",
              "video",
              "p",
              "h1",
              "h2",
              "h3",
              "h4",
              "h5",
              "h6",
              "input",
              "textarea",
              "select",
              "label",
            ],
            uiLibraryPath: "components/ui",
            exceptions: { uiComponents: true, testFiles: true, externalLinks: true },
          },
        ],
      },
    },
    {
      files: [
        "packages/ui/**/*.{ts,tsx}",
        "packages/features/**/*.{ts,tsx}",
        "apps/web/pages/**/*.{ts,tsx}",
      ],
      plugins: { silverkey },
      rules: {
        "silverkey/no-literal-hex-colors": [
          "warn",
          {
            includePaths: ["packages/ui/", "packages/features/", "apps/web/pages/"],
            allowedPaths: ["packages/design-tokens/"],
          },
        ],
        "silverkey/no-raw-spacing": [
          "warn",
          {
            includePaths: ["packages/ui/", "packages/features/"],
            allowedPaths: ["**/*.native.*"],
          },
        ],
      },
    },
    {
      files: ["apps/web/pages/**/*.ts"],
      plugins: { silverkey },
      rules: { "silverkey/no-standalone-ts-in-pages": "error" },
    },
  ];
}

/** apps/web: no JSX in .ts files. */
function appsWebNoJsxInTs() {
  return [
    {
      files: ["apps/web/**/*.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "JSXElement",
            message:
              "JSX is not allowed in .ts files under apps/web. Rename this file to .tsx (or remove JSX).",
          },
          {
            selector: "JSXFragment",
            message:
              "JSX is not allowed in .ts files under apps/web. Rename this file to .tsx (or remove JSX).",
          },
        ],
      },
    },
  ];
}

/** packages (non-React): no React, no JSX. Excludes apps/web, packages/contexts, packages/hooks, packages/features, packages/ui, packages/navigation. */
function packagesNoReactNoJsx() {
  return [
    {
      files: [
        "packages/config/**/*.{js,jsx,ts,tsx}",
        "packages/schemas/**/*.{js,jsx,ts,tsx}",
        "packages/services/**/*.{js,jsx,ts,tsx}",
        "packages/store/**/*.{js,jsx,ts,tsx}",
        "packages/utils/**/*.{js,jsx,ts,tsx}",
      ],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react", "react-dom", "react/*", "react-dom/*"],
                message:
                  "React imports are not allowed in this package. Use framework-agnostic code or move to apps/web, packages/features, packages/ui, packages/contexts, or packages/hooks.",
              },
            ],
          },
        ],
        "no-restricted-syntax": [
          "error",
          {
            selector: "JSXElement",
            message:
              "JSX is not allowed in this package. Use framework-agnostic code or move to apps/web, packages/features, packages/ui, packages/contexts, or packages/hooks.",
          },
          {
            selector: "JSXFragment",
            message:
              "JSX is not allowed in this package. Use framework-agnostic code or move to apps/web, packages/features, packages/ui, packages/contexts, or packages/hooks.",
          },
        ],
      },
    },
  ];
}

/** packages/contexts and packages/hooks: react-hooks, react-refresh, silverkey, restricted imports. */
function contextsHooksOverrides(reactHooks, reactRefresh, silverkey) {
  return [
    {
      files: ["packages/contexts/**/*.{js,jsx,ts,tsx}", "packages/hooks/**/*.{js,jsx,ts,tsx}"],
      plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh, silverkey },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-hooks/exhaustive-deps": "error",
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        "silverkey/no-async-use-effect": "error",
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react-dom", "react-dom/*", "react-native", "react-native/*"],
                message:
                  "Do not use react-dom or react-native in shared packages; keep contexts/hooks dependency-pure for RN parity.",
              },
              {
                group: ["react-router-dom", "react-router-dom/*", "react-router", "react-router/*"],
                message:
                  "Use the navigation adapter (packages/navigation) instead of react-router so a second implementation for React Native can be added later.",
              },
            ],
          },
        ],
      },
    },
  ];
}

/** packages/navigation: react-hooks, silverkey, no react-dom/react-native. */
function navigationOverrides(reactHooks, silverkey) {
  return [
    {
      files: ["packages/navigation/**/*.{js,jsx,ts,tsx}"],
      plugins: { "react-hooks": reactHooks, silverkey },
      rules: {
        ...reactHooks.configs.recommended.rules,
        "react-hooks/exhaustive-deps": "error",
        "silverkey/no-async-use-effect": "error",
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react-dom", "react-dom/*", "react-native", "react-native/*"],
                message:
                  "Do not use react-dom or react-native in the navigation package; keep adapter dependency-pure for RN parity.",
              },
            ],
          },
        ],
      },
    },
  ];
}

/** packages/features + apps/web/pages: prefer navigation adapter over react-router. */
function featuresReactRouterRestriction() {
  return [
    {
      files: ["packages/features/**/*.{ts,tsx}", "apps/web/pages/**/*.{ts,tsx}"],
      rules: {
        "no-restricted-imports": [
          "warn",
          {
            patterns: [
              {
                group: ["react-router-dom", "react-router-dom/*", "react-router", "react-router/*"],
                message:
                  "Use the navigation adapter (packages/navigation) instead of react-router so a second implementation for React Native can be added later.",
              },
            ],
          },
        ],
      },
    },
  ];
}

/** Test files: no focused tests. */
function testNoFocusedOverrides(silverkey) {
  return [
    {
      files: [
        "**/*.test.{ts,tsx,js,jsx}",
        "**/*.spec.{ts,tsx,js,jsx}",
        "**/__tests__/**/*.{ts,tsx,js,jsx}",
      ],
      plugins: { silverkey },
      rules: { "silverkey/no-focused-tests": "error" },
    },
  ];
}

/** File-level exceptions (schemas, utils). */
function fileExceptionsOverrides() {
  return [
    {
      files: [
        "packages/schemas/nav.ts",
        "packages/utils/profile/types.ts",
        "packages/utils/profile/utils.ts",
        "packages/utils/search/MapZoomController.ts",
      ],
      rules: { "no-restricted-imports": "off", "no-restricted-syntax": "off" },
    },
  ];
}

/** packages/config/eslint/eslint-plugin-silverkey: relax some rules. */
function eslintPluginOverrides() {
  return [
    {
      files: ["packages/config/eslint/eslint-plugin-silverkey/**/*.js"],
      rules: {
        "@typescript-eslint/no-require-imports": "off",
        "silverkey/no-explicit-any-disable-reason": "off",
      },
    },
  ];
}

/** Folders with 15–16 direct children; defer decomposition to avoid import churn. */
function folderMaxItemsOverrides(silverkey) {
  return [
    {
      files: ["apps/web/pages/HomeAuth/**/*.{ts,tsx}", "packages/hooks/data/auth/**/*.ts"],
      plugins: { silverkey },
      rules: { "silverkey/folder-max-items": "off" },
    },
    {
      files: ["apps/mobile/**/*.{js,jsx,ts,tsx}"],
      plugins: { silverkey },
      rules: {
        "silverkey/folder-max-items": "off",
        "silverkey/no-relative-parent-imports": "off",
      },
    },
  ];
}

export default function getEslintOverrides(plugins) {
  const { silverkey, reactHooks, reactRefresh, jsxA11y } = plugins;

  return [
    ...sharedPackagesRestrictedGlobals(),
    ...a11yOverrides(jsxA11y),
    ...appsWebFetchOverride(),
    ...silverkeyComponentsAndFeatures(silverkey),
    ...appsWebNoJsxInTs(),
    ...packagesNoReactNoJsx(),
    ...contextsHooksOverrides(reactHooks, reactRefresh, silverkey),
    ...navigationOverrides(reactHooks, silverkey),
    ...featuresReactRouterRestriction(),
    ...testNoFocusedOverrides(silverkey),
    ...fileExceptionsOverrides(),
    ...eslintPluginOverrides(),
    ...folderMaxItemsOverrides(silverkey),
  ];
}
