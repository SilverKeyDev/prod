/**
 * Re-export root logger so packages can import via "packages/logger".
 * The canonical implementation lives in ./logger/ (this file must not use the
 * "packages/logger" alias or it resolves to itself and causes TS2303 circular definition).
 */
export type {
  ApiSubcategory,
  ApiSubcategoryConfig,
  LogCategory,
  LoggerConfig,
} from "./logger/index";
export { API_SUBCATEGORIES, log, LOG_CATEGORIES, logger } from "./logger/index";
