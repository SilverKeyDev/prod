import type { ApiSubcategory, LogCategory } from "./categories";
import {
  apiSubcategoryToConfigKey,
  categoryToConfigKey,
  isAlwaysEnabled,
  LOG_CATEGORIES,
} from "./categories";
import type { ApiSubcategoryConfig, LoggerConfig } from "./loggerTypes";

/**
 * Check if a category is enabled for the given config snapshot.
 * Handles defined categories, future JSON-only categories, and API subcategories.
 */
export function checkCategoryEnabled(
  config: LoggerConfig,
  category: LogCategory | string,
  subcategory?: ApiSubcategory
): boolean {
  if (!category || typeof category !== "string") {
    return false;
  }

  if (category in LOG_CATEGORIES) {
    const logCategory = category as LogCategory;
    if (isAlwaysEnabled(logCategory)) {
      return true;
    }
  }

  let configKey: string;
  try {
    if (category in LOG_CATEGORIES) {
      configKey = categoryToConfigKey(category as LogCategory);
    } else {
      configKey = category
        .toLowerCase()
        .split("_")
        .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
        .join("");
    }
  } catch {
    configKey = category
      .toLowerCase()
      .split("_")
      .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join("");
  }

  const configValue = config[configKey as keyof LoggerConfig];

  if (category === "API" || configKey === "api") {
    if (typeof configValue === "object" && configValue !== null) {
      const apiConfig = configValue as ApiSubcategoryConfig;
      if (subcategory) {
        const subcategoryKey = apiSubcategoryToConfigKey(subcategory);
        return apiConfig[subcategoryKey as keyof ApiSubcategoryConfig] === true;
      }
      return (
        apiConfig.initialLoad === true ||
        apiConfig.polling === true ||
        apiConfig.pageMount === true ||
        apiConfig.other === true
      );
    }
    return configValue === true;
  }

  return configValue === true;
}
