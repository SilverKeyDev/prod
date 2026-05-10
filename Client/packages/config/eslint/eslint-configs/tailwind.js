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
        // no-contradicting-classname can throw under ESLint 9 with some dynamic patterns
        "tailwindcss/no-contradicting-classname": "off",
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
