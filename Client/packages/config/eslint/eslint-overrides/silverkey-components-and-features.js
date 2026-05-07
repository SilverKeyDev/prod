/**
 * Silverkey rules for packages/ui, packages/features, apps/web pages, and shared (no-hardcoded-jsx, no-native-date, etc.).
 * @param {object} silverkey
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function silverkeyComponentsAndFeatures(silverkey) {
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
              "div",
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
            exceptions: {
              uiComponents: true,
              testFiles: true,
              externalLinks: true,
            },
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
        "silverkey/no-raw-zindex": [
          "warn",
          {
            includePaths: ["packages/ui/", "packages/features/", "apps/web/", "apps/mobile/"],
            allowedPaths: [
              "packages/design-tokens/tokens/zLayers",
              "packages/config/tailwind/",
              "mapOverlayLayerOrder",
              "propertyCommuteNative.constants",
            ],
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
