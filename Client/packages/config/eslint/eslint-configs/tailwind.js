/**
 * Tailwind CSS ESLint configuration for web + shared packages
 * (NativeWind / mobile excluded via ignores).
 * @param {{ tailwindPlugin: object }} plugins
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.join(__dirname, "../../../..");
const tailwindConfigPath = path.resolve(clientRoot, "apps/web/tailwind.config.ts");

export default function getTailwindConfig({ tailwindPlugin }) {
  return [
    {
      files: ["apps/web/**/*.{js,jsx,ts,tsx}", "packages/**/*.{js,jsx,ts,tsx}"],
      ignores: ["**/*.native.*", "apps/mobile/**"],
      plugins: { tailwindcss: tailwindPlugin },
      settings: {
        tailwindcss: {
          callees: ["classNames", "clsx", "cn", "cva"],
          config: tailwindConfigPath,
        },
      },
      rules: {
        // Catches the same conflicting utilities as Tailwind IntelliSense `cssConflict`
        // (e.g. `active:text-neutral-500` + `active:text-neutral-800`). Prefer static
        // class strings or `cn()` branches so the rule can analyze them.
        "tailwindcss/no-contradicting-classname": "error",
        "tailwindcss/classnames-order": "off",
        "tailwindcss/no-custom-classname": "off",
        "tailwindcss/enforces-shorthand": "off",
        "tailwindcss/enforces-negative-arbitrary-values": "off",
        "tailwindcss/no-unnecessary-arbitrary-value": "off",
        "tailwindcss/no-arbitrary-value": "off",
        "tailwindcss/migration-from-tailwind-2": "off",
      },
    },
  ];
}
