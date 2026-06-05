/**
 * File-level exceptions (schemas, utils).
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function fileExceptionsOverrides() {
  return [
    {
      files: [
        "packages/schemas/nav.ts",
        "packages/utils/profile/types.ts",
        "packages/utils/profile/utils.ts",
        "packages/utils/product/search/MapZoomController.ts",
      ],
      rules: { "no-restricted-imports": "off", "no-restricted-syntax": "off" },
    },
  ];
}
