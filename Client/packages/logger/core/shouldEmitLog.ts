import type { ApiSubcategory, LogCategory } from "./categories";
import { checkCategoryEnabled } from "./checkCategoryEnabled";
import { isLogLevelEnabled } from "./isLogLevelEnabled";
import type { LoggerConfig, LogLevel } from "./loggerTypes";

export function shouldEmitLog(
  config: LoggerConfig,
  level: LogLevel,
  category: LogCategory | string,
  subcategory?: ApiSubcategory
): boolean {
  if (!checkCategoryEnabled(config, category, subcategory)) {
    return false;
  }
  return isLogLevelEnabled(config.logLevel, level);
}
