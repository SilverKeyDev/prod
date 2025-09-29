import type { StateCreator } from "zustand";
import {
  persist,
  type StateStorage,
  type PersistOptions,
} from "zustand/middleware";

import { isFunction } from "../../utils/typeGuards";

/**
 * Safe persist wrapper with versioning, migration, and an allowlist via partialize.
 * - Requires callers to provide a partialize function that explicitly selects safe fields.
 * - Forces consumers to pass a storage (e.g., localStorage) to avoid accidental defaults.
 */
export type PersistSafeOptions<T> = {
  name: string;
  version: number;
  storage: StateStorage<unknown>;
  migrate?: (persistedState: unknown, version: number) => T | Promise<T>;
  partialize: (state: T) => Partial<T>;
};

export function persistSafe<T>(
  config: StateCreator<T>,
  options: PersistSafeOptions<T>,
) {
  const { name, version, storage, migrate, partialize } = options;

  const persistOptions = {
    name,
    version,
    storage,
    migrate: isFunction(migrate) ? migrate : undefined,
    partialize,
  } as const;

  return persist<T>(config, persistOptions as unknown as PersistOptions<T>);
}
