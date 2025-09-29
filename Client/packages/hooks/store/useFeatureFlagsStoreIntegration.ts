import { useFeatureFlagsStore } from "../../store/featureFlags.slice";

/**
 * Hook that integrates feature flags data with useFeatureFlagsStore
 * This replaces the FeatureFlagsProvider functionality
 *
 * Note: Feature flags don't have a dedicated data hook yet,
 * so this integration hook primarily manages the store state
 */
export function useFeatureFlagsStoreIntegration() {
  const { flags, refreshFlags } = useFeatureFlagsStore();

  // Expose the store state and actions
  return {
    // State
    flags,

    // Actions
    refreshFlags,
  };
}
