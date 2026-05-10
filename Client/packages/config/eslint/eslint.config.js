import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

import getBaseConfig from "./eslint-configs/base.js";
import getReactConfig from "./eslint-configs/react.js";
import getSilverkeyConfig from "./eslint-configs/silverkey.js";
import getTailwindConfig from "./eslint-configs/tailwind.js";
import getTypeAwareConfig from "./eslint-configs/type-aware.js";
import getEslintOverrides from "./eslint-overrides.js";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const silverkey = require(path.join(__dirname, "eslint-plugin-silverkey"));
const tailwindPlugin = require("eslint-plugin-tailwindcss");

export default tseslint.config(
  ...getBaseConfig(),
  ...getSilverkeyConfig({ silverkey }),
  ...getTypeAwareConfig({ silverkey }),
  ...getReactConfig({ silverkey, reactHooks, reactRefresh }),
  ...getTailwindConfig({ tailwindPlugin }),
  ...getEslintOverrides({ silverkey, reactHooks, reactRefresh, jsxA11y }),
  prettier
);
