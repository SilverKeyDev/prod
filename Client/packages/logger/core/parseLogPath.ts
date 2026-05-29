import type { ApiSubcategory, LogCategory, LogPath } from "./categories";
import { API_SUBCATEGORIES, LOG_CATEGORIES, LOG_PATHS } from "./categories";

export type ParsedLogPath = {
  path: LogPath | string;
  category: LogCategory;
  subcategory?: ApiSubcategory;
  categoryLabel: string;
};

const LOG_PATH_SET = new Set<string>(LOG_PATHS);

function isLogCategory(value: string): value is LogCategory {
  return value in LOG_CATEGORIES;
}

function isApiSubcategory(value: string): value is ApiSubcategory {
  return value in API_SUBCATEGORIES;
}

export function parseLogPath(input: LogCategory | LogPath | string): ParsedLogPath {
  if (isLogCategory(input)) {
    return {
      path: input,
      category: input,
      categoryLabel: input,
    };
  }

  const normalized = input.trim();
  if (!normalized) {
    throw new Error("Log path must be a non-empty string");
  }

  if (LOG_PATH_SET.has(normalized)) {
    const dotIndex = normalized.indexOf(".");
    if (dotIndex === -1) {
      const category = normalized as LogCategory;
      return {
        path: category,
        category,
        categoryLabel: category,
      };
    }

    const categoryPart = normalized.slice(0, dotIndex);
    const subPart = normalized.slice(dotIndex + 1);
    if (!isLogCategory(categoryPart) || !isApiSubcategory(subPart)) {
      throw new Error(`Invalid log path: ${normalized}`);
    }

    return {
      path: normalized as LogPath,
      category: categoryPart,
      subcategory: subPart,
      categoryLabel: normalized,
    };
  }

  const dotIndex = normalized.indexOf(".");
  if (dotIndex !== -1) {
    const categoryPart = normalized.slice(0, dotIndex);
    const subPart = normalized.slice(dotIndex + 1);
    if (isLogCategory(categoryPart) && isApiSubcategory(subPart)) {
      return {
        path: normalized,
        category: categoryPart,
        subcategory: subPart,
        categoryLabel: normalized,
      };
    }
  }

  if (isLogCategory(normalized)) {
    return {
      path: normalized,
      category: normalized,
      categoryLabel: normalized,
    };
  }

  throw new Error(`Unknown log path: ${normalized}`);
}
