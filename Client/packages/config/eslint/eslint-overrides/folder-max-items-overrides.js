/**
 * Folders with 15–16 direct children; defer decomposition to avoid import churn.
 * @param {object} silverkey
 * @returns {import('eslint').Linter.FlatConfig[]}
 */
export function folderMaxItemsOverrides(silverkey) {
  return [
    {
      files: ["packages/features/checklists/utils/rules/checklistRules.test.ts"],
      plugins: { silverkey },
      rules: { "silverkey/max-lines-hard": "off" },
    },
    {
      files: ["packages/features/profile/utils/onboarding/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: { "silverkey/folder-max-items": "off" },
    },
    {
      files: ["apps/web/pages/HomeAuth/**/*.{ts,tsx}"],
      plugins: { silverkey },
      rules: { "silverkey/folder-max-items": "off" },
    },
    {
      files: ["apps/mobile/**/*.{js,jsx,ts,tsx}"],
      plugins: { silverkey },
      rules: {
        "silverkey/folder-max-items": "off",
        "silverkey/no-relative-parent-imports": "off",
      },
    },
  ];
}
