/**
 * Persistence and text extraction for negotiation service
 */

import { log, LOG_CATEGORIES } from "packages/logger";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

import { NEGOTIATION_STORAGE_KEYS } from "./types";

export { NEGOTIATION_STORAGE_KEYS };

export function loadFromSessionStorage(key: string): unknown {
  try {
    const item = getSessionStorage().getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error: unknown) {
    log.warn(LOG_CATEGORIES.ERRORS, `Failed to load ${key} from sessionStorage`, { key, error });
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
