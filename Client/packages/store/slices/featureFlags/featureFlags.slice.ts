import { create } from "zustand";

import { getWindow } from "packages/utils/platform";

export type FeatureFlagsState = {
  flags: Record<string, boolean>;
  refreshFlags: () => Promise<void> | void;
  reset: () => void;
};

// Optionally hydrate from a global config object during init
function readInitialFlags(): Record<string, boolean> {
  try {
    const win = getWindow() as unknown as {
      __FEATURE_FLAGS__?: Record<string, boolean>;
    } | null;
    const fromWindow = win?.__FEATURE_FLAGS__;
    if (fromWindow && typeof fromWindow === "object") return { ...fromWindow };
  } catch {
    // Ignore errors when accessing window feature flags
  }
  return {};
}

export const useFeatureFlagsStore = create<FeatureFlagsState>((set) => ({
  flags: readInitialFlags(),
  refreshFlags: () => {
    // If flags can be dynamic, wire to your config endpoint here.
    // Keep this read-only in the store; do not mix business logic.
    try {
      const updated = readInitialFlags();
      set({ flags: updated });
    } catch {
      // noop on failure; keep last known flags
    }
    return Promise.resolve();
  },
  reset: () => {
    set({ flags: readInitialFlags() });
  },
}));
