import { useFeatureFlagsStore } from "../../../../packages/store/featureFlags.slice";

/**
 * Hook to check feature flags
 */
export function useFeatureFlag(flag: string): boolean {
  const flags = useFeatureFlagsStore((s) => s.flags);
  return flags[flag] ?? false;
}

/**
 * Hook to get multiple feature flags
 */
export function useFeatureFlags(flags: string[]): Record<string, boolean> {
  const featureFlags = useFeatureFlagsStore((s) => s.flags);
  return flags.reduce(
    (acc, flag) => {
      acc[flag] = featureFlags[flag] ?? false;
      return acc;
    },
    {} as Record<string, boolean>,
  );
}
