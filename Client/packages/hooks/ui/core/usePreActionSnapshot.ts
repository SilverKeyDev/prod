import { useCallback, useRef } from "react";

import {
  getFromSessionStorage,
  removeFromSessionStorage,
  setToSessionStorage,
} from "packages/utils";

export type UsePreActionSnapshotReturn<T> = {
  snapshot: (value: T) => void;
  restore: () => T | null;
  clearSnapshot: () => void;
};

/**
 * Hook for snapshot/restore pattern before async actions (e.g., search cancel).
 * Saves to both in-memory ref (fast restore) and sessionStorage (resilience).
 * Use before starting an action that may be cancelled; call restore on cancel.
 */
export function usePreActionSnapshot<T>(
  key: string,
): UsePreActionSnapshotReturn<T> {
  const ref = useRef<T | null>(null);

  const snapshot = useCallback(
    (value: T) => {
      ref.current = value;
      setToSessionStorage(key, value);
    },
    [key],
  );

  const restore = useCallback((): T | null => {
    // Prefer in-memory ref for fast restore
    const fromRef = ref.current;
    if (fromRef !== null) {
      ref.current = null;
      removeFromSessionStorage(key);
      return fromRef;
    }
    // Fall back to sessionStorage (e.g., after refresh)
    const fromStorage = getFromSessionStorage<T>(key);
    if (fromStorage !== null) {
      removeFromSessionStorage(key);
      return fromStorage;
    }
    return null;
  }, [key]);

  const clearSnapshot = useCallback(() => {
    ref.current = null;
    removeFromSessionStorage(key);
  }, [key]);

  return { snapshot, restore, clearSnapshot };
}
