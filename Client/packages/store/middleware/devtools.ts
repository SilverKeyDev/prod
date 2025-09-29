import type { StateCreator } from "zustand";
import { devtools } from "zustand/middleware";

/**
 * Wrap a slice with Zustand devtools and a readable name.
 * Usage: withDevtools('ui')(config)
 */
export function withDevtools<T extends object>(name: string) {
  return (config: StateCreator<T>) => devtools<T>(config, { name });
}
