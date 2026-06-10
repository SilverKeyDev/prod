import { useCallback } from "react";

import { useSearchDisplaySettings } from "packages/features/search/hooks/data/useSearchDisplaySettings";
import { useFiltersStore } from "packages/features/search/store/filters.slice";
import { useAuthStore } from "packages/store";

export function useStrictPreferencesToggle(): {
  preferencesStrictFilter: boolean;
  handleStrictPreferences: (checked: boolean) => void;
} {
  const authReady = useAuthStore((s) => s.authReady);
  const { patchSearchDisplay } = useSearchDisplaySettings(authReady);
  const preferencesStrictFilter = useFiltersStore((s) => s.preferencesStrictFilter);
  const setPreferencesStrictFilter = useFiltersStore((s) => s.setPreferencesStrictFilter);

  const handleStrictPreferences = useCallback(
    (checked: boolean) => {
      setPreferencesStrictFilter(checked);
      patchSearchDisplay({ preferences_strict_filter: checked });
    },
    [setPreferencesStrictFilter, patchSearchDisplay]
  );

  return { preferencesStrictFilter, handleStrictPreferences };
}
