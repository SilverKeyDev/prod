/**
 * ESLint flat config overrides (silverkey, apps/web, packages, tests).
 * Imported by eslint.config.js to keep the main config under the line limit.
 * @param {{ silverkey: object, reactHooks: object, reactRefresh: object, jsxA11y: object }} plugins
 * @returns {import('eslint').Linter.FlatConfig[]}
 */

import { a11yOverrides } from "./eslint-overrides/a11y-overrides.js";
import { appsWebFetchOverride, appsWebNoJsxInTs } from "./eslint-overrides/apps-web-overrides.js";
import { contextsHooksOverrides } from "./eslint-overrides/contexts-hooks-overrides.js";
import { featuresReactRouterRestriction } from "./eslint-overrides/features-react-router-restriction.js";
import { fileExceptionsOverrides } from "./eslint-overrides/file-exceptions-overrides.js";
import { folderMaxItemsOverrides } from "./eslint-overrides/folder-max-items-overrides.js";
import { generatedApiTypesOverride } from "./eslint-overrides/generated-api-types-overrides.js";
import { eslintPluginOverrides } from "./eslint-overrides/internal-eslint-plugin-overrides.js";
import { navigationOverrides } from "./eslint-overrides/navigation-overrides.js";
import { packagesNoReactNoJsx } from "./eslint-overrides/packages-no-react-jsx.js";
import { sharedPackagesRestrictedGlobals } from "./eslint-overrides/shared-packages-restricted-globals.js";
import { silverkeyComponentsAndFeatures } from "./eslint-overrides/silverkey-components-and-features.js";
import { testNoFocusedOverrides } from "./eslint-overrides/test-overrides.js";

export default function getEslintOverrides(plugins) {
  const { silverkey, reactHooks, reactRefresh, jsxA11y } = plugins;

  return [
    ...sharedPackagesRestrictedGlobals(),
    ...a11yOverrides(jsxA11y),
    ...appsWebFetchOverride(),
    ...silverkeyComponentsAndFeatures(silverkey),
    ...appsWebNoJsxInTs(),
    ...packagesNoReactNoJsx(),
    ...contextsHooksOverrides(reactHooks, reactRefresh, silverkey),
    ...navigationOverrides(reactHooks, silverkey),
    ...featuresReactRouterRestriction(),
    ...testNoFocusedOverrides(silverkey),
    ...fileExceptionsOverrides(),
    ...eslintPluginOverrides(),
    ...generatedApiTypesOverride(),
    ...folderMaxItemsOverrides(silverkey),
  ];
}
