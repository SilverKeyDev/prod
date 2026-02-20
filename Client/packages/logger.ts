/**
 * Re-export root logger so packages can import via relative paths (e.g. ../../logger).
 * The canonical logger lives at Client/logger/.
 */
export type {
  ApiSubcategory,
  ApiSubcategoryConfig,
  LogCategory,
  LoggerConfig,
} from "logger";
export { API_SUBCATEGORIES, log, LOG_CATEGORIES, logger } from "logger";
