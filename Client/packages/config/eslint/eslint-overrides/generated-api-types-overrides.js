/**
 * OpenAPI-generated types: allow large file and helper `any` from openapi-typescript output.
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function generatedApiTypesOverride() {
  return [
    {
      files: ["packages/types/api.generated.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "silverkey/max-lines-hard": "off",
      },
    },
  ];
}
