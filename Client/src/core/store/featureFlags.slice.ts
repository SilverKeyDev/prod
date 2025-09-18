import { create } from 'zustand';

import { withDevtools } from './middleware/devtools';
import { withResettable } from './middleware/resettable';

export type FeatureFlagsState = {
  flags: Record<string, boolean>;
  refreshFlags: () => Promise<void> | void;
  reset: () => void;
};

// Optionally hydrate from a global config object during init
function readInitialFlags(): Record<string, boolean> {
  try {
    const fromWindow = (window as unknown as { __FEATURE_FLAGS__?: Record<string, boolean> })
      ?.__FEATURE_FLAGS__;
    if (fromWindow && typeof fromWindow === 'object') return { ...fromWindow };
  } catch {
    // Ignore errors when accessing window feature flags
  }
  return {};
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  withDevtools('featureFlags')(
    withResettable<FeatureFlagsState>(
      (set, _get) => ({
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
        // reset added by withResettable
        reset: () => {},
      }),
      () => ({ flags: readInitialFlags(), reset: () => {}, refreshFlags: () => {} })
    )
  )
);
