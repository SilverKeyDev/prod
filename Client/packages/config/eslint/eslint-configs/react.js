/**
 * React-specific ESLint configuration: hooks rules, fast-refresh rules,
 * and silverkey React state/async rules for apps/web and shared packages.
 * @param {{ silverkey: object, reactHooks: object, reactRefresh: object }} plugins
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

export default function getReactConfig({ silverkey, reactHooks, reactRefresh }) {
  return [
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
        ...reactHooks.configs.recommended.rules,
        "react-hooks/exhaustive-deps": "error",
        "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
        // State: no getState() in app/feature UI; use selectors/hooks only
        "silverkey/no-zustand-get-state": "error",
        // Async: no useEffect(async) to avoid setState on unmounted + enforce cancellation
        "silverkey/no-async-use-effect": "error",
      },
    },
  ];
}
