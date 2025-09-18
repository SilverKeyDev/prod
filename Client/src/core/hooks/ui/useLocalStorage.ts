import { useState, useCallback, useEffect } from 'react';


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
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error: unknown) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  // Update localStorage and state
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((prevValue) => {
          if (typeof value === 'function') {
            const computed = (value as (prev: T) => T)(prevValue);
            localStorage.setItem(key, JSON.stringify(computed));
            return computed;
          }
          localStorage.setItem(key, JSON.stringify(value));
          return value;
        });
      } catch (error: unknown) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  // Remove from localStorage and reset to default
  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error: unknown) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch (error: unknown) {
          // Type-safe error handling with proper type guards
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === 'object' && error !== null
                ? (() => {
                    try {
                      return JSON.stringify(error);
                    } catch {
                      return '[Object]';
                    }
                  })()
                : (() => {
                    try {
                      if (typeof error === 'string') return error;
                      if (typeof error === 'number') return String(error);
                      if (typeof error === 'boolean') return String(error);
                      if (error === null || error === undefined) return 'Unknown error';
                      return '[Unknown]';
                    } catch {
                      return '[Unknown]';
                    }
                  })();
          console.warn(`Error parsing localStorage change for key "${key}":`, errorMessage);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return { value, setValue, removeValue };
}
