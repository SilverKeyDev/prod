/**
 * packages (non-React): no React, no JSX. Excludes apps/web, packages/contexts, packages/hooks, packages/features, packages/ui, packages/navigation.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function packagesNoReactNoJsx() {
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
