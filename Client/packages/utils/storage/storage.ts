/**
 * Global localStorage/sessionStorage utility functions.
 * Uses platform storage abstraction so shared packages stay React Native–safe.
 */

import { log, LOG_CATEGORIES } from "packages/logger";

import { getLocalStorage, getSessionStorage, type KeyValueStorage } from "./platformStorage";

export type StorageOptions<T = unknown> = {
  defaultValue?: T | null;
  errorPrefix?: string;
};

/**
 * Safely get an item from localStorage with JSON parsing
 */
export const getFromStorage = <T>(key: string, options: StorageOptions<T> = {}): T | null => {
  const { defaultValue = null, errorPrefix = "❌" } = options;

  try {
    const item = getLocalStorage().getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.API, "Error reading localStorage", {
      key,
      errorPrefix,
      error,
    });
    return defaultValue;
  }
};

/**
 * Safely set an item to localStorage with JSON serialization
 */
export const setToStorage = (
  key: string,
  value: unknown,
  options: StorageOptions = {}
): boolean => {
  const { errorPrefix = "❌" } = options;

  try {
    getLocalStorage().setItem(key, JSON.stringify(value));
    return true;
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.API, "Error setting localStorage", {
      key,
      errorPrefix,
      error,
    });
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 */
export const removeFromStorage = (key: string, options: StorageOptions = {}): boolean => {
  const { errorPrefix = "❌" } = options;

  try {
    getLocalStorage().removeItem(key);
    return true;
  } catch (error: unknown) {
    log.error(LOG_CATEGORIES.API, "Error removing localStorage", {
      key,
      errorPrefix,
      error,
    });
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = "__storage_test__";
    const storage = getLocalStorage();
    storage.setItem(testKey, "test");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get multiple items from localStorage at once
 */
export const getMultipleFromStorage = <T extends Record<string, unknown>>(
  keys: (keyof T)[],
  options: StorageOptions = {}
): Partial<T> => {
  const result: Partial<T> = {};

  keys.forEach((key) => {
    const value = getFromStorage(key as string, options);
    if (value !== null) {
      result[key] = value as T[keyof T];
    }
  });

  return result;
};

/**
 * Set multiple items to localStorage at once
 */
export const setMultipleToStorage = <T extends Record<string, unknown>>(
  items: T,
  options: StorageOptions = {}
): boolean => {
  try {
    Object.entries(items).forEach(([key, value]) => {
      setToStorage(key, value, options);
    });
    return true;
  } catch (error: unknown) {
    const { errorPrefix = "❌" } = options;
    log.error(LOG_CATEGORIES.API, "Error setting multiple localStorage items", {
      errorPrefix,
      error,
    });
    return false;
  }
};

/**
 * Storage helpers for a given storage implementation (localStorage or sessionStorage-like).
 */
export const createStorageHelpers = (storage: KeyValueStorage) => ({
  get: <T>(key: string, options: StorageOptions<T> = {}): T | null => {
    const { defaultValue = null, errorPrefix = "❌" } = options;
    try {
      const item = storage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.API, "Error reading storage", {
        key,
        errorPrefix,
        error,
      });
      return defaultValue;
    }
  },
  set: (key: string, value: unknown, options: StorageOptions = {}): boolean => {
    const { errorPrefix = "❌" } = options;
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.API, "Error setting storage", {
        key,
        errorPrefix,
        error,
      });
      return false;
    }
  },
  remove: (key: string, options: StorageOptions = {}): boolean => {
    const { errorPrefix = "❌" } = options;
    try {
      storage.removeItem(key);
      return true;
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.API, "Error removing storage", {
        key,
        errorPrefix,
        error,
      });
      return false;
    }
  },
});

const sessionStorageHelpers = createStorageHelpers(getSessionStorage());

/**
 * Safely get an item from sessionStorage with JSON parsing
 */
export const getFromSessionStorage = <T>(key: string, options: StorageOptions<T> = {}): T | null =>
  sessionStorageHelpers.get(key, options);

/**
 * Safely set an item to sessionStorage with JSON serialization
 */
export const setToSessionStorage = (
  key: string,
  value: unknown,
  options: StorageOptions = {}
): boolean => sessionStorageHelpers.set(key, value, options);

/**
 * Safely remove an item from sessionStorage
 */
export const removeFromSessionStorage = (key: string, options: StorageOptions = {}): boolean =>
  sessionStorageHelpers.remove(key, options);
