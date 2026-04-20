/**
 * apps/web: error on direct fetch; no JSX in .ts files.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

export function appsWebFetchOverride() {
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

export function appsWebNoJsxInTs() {
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
