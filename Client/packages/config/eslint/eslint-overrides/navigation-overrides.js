/**
 * packages/navigation: react-hooks, silverkey, no react-dom/react-native.
 * @param {object} reactHooks
 * @param {object} silverkey
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function navigationOverrides(reactHooks, silverkey) {
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
