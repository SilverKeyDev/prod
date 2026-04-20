/**
 * packages/contexts and packages/hooks: react-hooks, react-refresh, silverkey, restricted imports.
 * @param {object} reactHooks
 * @param {object} reactRefresh
 * @param {object} silverkey
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function contextsHooksOverrides(reactHooks, reactRefresh, silverkey) {
  return [
    {
      files: ["packages/contexts/**/*.{js,jsx,ts,tsx}", "packages/hooks/**/*.{js,jsx,ts,tsx}"],
      plugins: {
        "react-hooks": reactHooks,
        "react-refresh": reactRefresh,
        silverkey,
      },
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
