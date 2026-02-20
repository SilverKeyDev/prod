import { useFeatureFlagsStore } from "packages/store";

/**
 * Check if a feature flag is enabled. Use this for feature gating instead of
 * platform checks (e.g. platform === 'ios') so release is decoupled from
 * app store deployment.
 *
 * @param flagName - Feature flag key (e.g. 'reels_enabled')
 * @returns true if the flag is enabled, false otherwise
 */
export function useFeature(flagName: string): boolean {
  const flags = useFeatureFlagsStore((s) => s.flags);
  return Boolean(flags[flagName]);
}
