/**
 * Persistence and text extraction for negotiation service
 */

import { log, LOG_CATEGORIES } from "logger";

import { getSessionStorage } from "packages/utils/core/storage/platformStorage";

import { NEGOTIATION_STORAGE_KEYS } from "./types";

export { NEGOTIATION_STORAGE_KEYS };

export function loadFromSessionStorage(key: string): unknown {
  try {
    const item = getSessionStorage().getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error: unknown) {
    log.warn(
      LOG_CATEGORIES.ERRORS,
      `Failed to load ${key} from sessionStorage`,
      { key, error },
    );
    return null;
  }
}

export function saveToSessionStorage(key: string, value: unknown): void {
  try {
    getSessionStorage().setItem(key, JSON.stringify(value));
  } catch (error: unknown) {
    log.warn(LOG_CATEGORIES.ERRORS, `Failed to save ${key} to sessionStorage`, {
      key,
      error,
    });
  }
}

/**
 * Extract textual content from response data (for display/search)
 */
export function extractTextContent(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const textParts: string[] = [];
  const extractFromObject = (obj: Record<string, unknown>, depth = 0): void => {
    if (depth > 10) return;

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string" && value.trim().length > 0) {
        if (
          value.length > 3 &&
          !["id", "type", "status", "created_at", "updated_at"].includes(
            key.toLowerCase(),
          )
        ) {
          textParts.push(value.trim());
        }
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string" && item.trim().length > 3) {
            textParts.push(item.trim());
          } else if (typeof item === "object" && item !== null) {
            extractFromObject(item as Record<string, unknown>, depth + 1);
          }
        });
      } else if (typeof value === "object" && value !== null) {
        extractFromObject(value as Record<string, unknown>, depth + 1);
      }
    }
  };

  extractFromObject(data as Record<string, unknown>);
  return textParts.join(" ").trim();
}
