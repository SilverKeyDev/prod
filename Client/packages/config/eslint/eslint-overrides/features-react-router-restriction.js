/**
 * packages/features + apps/web/pages: prefer navigation adapter over react-router.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function featuresReactRouterRestriction() {
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
