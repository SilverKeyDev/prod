/**
 * Test files: no focused tests.
 * @param {object} silverkey
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function testNoFocusedOverrides(silverkey) {
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
