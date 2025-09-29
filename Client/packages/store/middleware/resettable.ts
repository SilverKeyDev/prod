import type { StoreApi } from "zustand";

/**
 * Adds a reset() method that restores the slice to its initial state.
 * Assumes the slice object is shallow-assignable.
 */
export function withResettable<T extends object>(
  config: (
    set: (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean,
    ) => void,
    get: () => T,
    store: StoreApi<T>,
  ) => T,
  initialSliceFactory: (
    set: (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean,
    ) => void,
    get: () => T,
    store: StoreApi<T>,
  ) => T,
) {
  return (
    set: (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean,
    ) => void,
    get: () => T,
    store: StoreApi<T>,
  ) => {
    const initialState = initialSliceFactory(set, get, store);
    const slice = config(set, get, store) as T & { reset?: () => void };
    return {
      ...slice,
      reset: () => set(() => ({ ...initialState })),
    } as T & { reset: () => void };
  };
}
