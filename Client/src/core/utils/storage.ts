/**
 * Global localStorage utility functions
 * Provides consistent error handling and JSON serialization across the app
 */

export type StorageOptions<T = unknown> = {
  defaultValue?: T | null;
  errorPrefix?: string;
};

/**
 * Safely get an item from localStorage with JSON parsing
 */
export const getFromStorage = <T>(key: string, options: StorageOptions<T> = {}): T | null => {
  const { defaultValue = null, errorPrefix = '❌' } = options;

  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error: unknown) {
    console.error(`${errorPrefix} Error reading localStorage key "${key}":`, error);
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
  const { errorPrefix = '❌' } = options;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error: unknown) {
    console.error(`${errorPrefix} Error setting localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Safely remove an item from localStorage
 */
export const removeFromStorage = (key: string, options: StorageOptions = {}): boolean => {
  const { errorPrefix = '❌' } = options;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error: unknown) {
    console.error(`${errorPrefix} Error removing localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * Check if localStorage is available
 */
export const isStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
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
    const { errorPrefix = '❌' } = options;
    console.error(`${errorPrefix} Error setting multiple localStorage items:`, error);
    return false;
  }
};
