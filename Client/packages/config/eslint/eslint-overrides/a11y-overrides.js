/**
 * jsx-a11y for apps/web, packages/contexts, packages/hooks, packages/features, packages/ui.
 * @param {object} jsxA11y
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function a11yOverrides(jsxA11y) {
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
