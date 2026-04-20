/**
 * packages/config/eslint/eslint-plugin-silverkey: relax some rules.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function eslintPluginOverrides() {
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
