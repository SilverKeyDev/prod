import { useCallback, useEffect, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { getWindow } from "packages/utils/platform";
import { getLocalStorage } from "packages/utils/storage/platformStorage";

import { getErrorMessage } from "./errorMessageHelpers";

export type UseLocalStorageReturn<T> = {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
};

/**
 * Generic localStorage hook - reusable logic without business nouns
 * Handles JSON serialization, error handling, and reactive updates
 */
export function useLocalStorage<T>(key: string, defaultValue: T): UseLocalStorageReturn<T> {
  // Get initial value from localStorage or use default
  const [value, setStoredValue] = useState<T>(() => {
    try {
      const item = getLocalStorage().getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error: unknown) {
      log.warn(LOG_CATEGORIES.HOOKS, "Error reading localStorage", {
        key,
        error,
      });
      return defaultValue;
    }
  });

  // Update localStorage and state
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prevValue) => {
          if (typeof value === "function") {
            const computed = (value as (prev: T) => T)(prevValue);
            getLocalStorage().setItem(key, JSON.stringify(computed));
            return computed;
          }
          getLocalStorage().setItem(key, JSON.stringify(value));
          return value;
        });
      } catch (error: unknown) {
        log.warn(LOG_CATEGORIES.HOOKS, "Error setting localStorage", {
          key,
          error,
        });
      }
    },
    [key]
  );

  // Remove from localStorage and reset to default
  const removeValue = useCallback(() => {
    try {
      getLocalStorage().removeItem(key);
      setStoredValue(defaultValue);
    } catch (error: unknown) {
      log.warn(LOG_CATEGORIES.HOOKS, "Error removing localStorage", {
        key,
        error,
      });
    }
  }, [key, defaultValue]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error: unknown) {
          log.warn(LOG_CATEGORIES.HOOKS, "Error parsing localStorage change", {
            key,
            errorMessage: getErrorMessage(error),
          });
        }
      }
    };

    const win = getWindow();
    if (!win) return;
    win.addEventListener("storage", handleStorageChange);
    return () => win.removeEventListener("storage", handleStorageChange);
  }, [key]);

  return { value, setValue, removeValue };
}
