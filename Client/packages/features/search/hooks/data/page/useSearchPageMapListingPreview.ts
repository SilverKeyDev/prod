import { useCallback, useMemo } from "react";

import { getEnv } from "packages/config";
import { useFiltersStore } from "packages/store";

export function useSearchPageMapListingPreview() {
  const isDev = getEnv().isDevelopment;
  const showMapListingPreviews = useFiltersStore(
    (s) => s.showMapListingPreviews,
  );
  const dismissedMapPreviewIds = useFiltersStore(
    (s) => s.dismissedMapPreviewIds,
  );
  const clearDismissedMapPreviews = useFiltersStore(
    (s) => s.clearDismissedMapPreviews,
  );
  const setShowMapListingPreviewsAction = useFiltersStore(
    (s) => s.setShowMapListingPreviews,
  );
  const dismissMapListingPreviewAction = useFiltersStore(
    (s) => s.dismissMapListingPreview,
  );
  const mapListingPreviewsEnabled = !isDev || showMapListingPreviews;

  const mapPreviewSearchLifecycle = useMemo(
    () => ({
      onSearchStartClearDismissals: clearDismissedMapPreviews,
      onResultsCommittedEnablePreviews: () => {
        clearDismissedMapPreviews();
        setShowMapListingPreviewsAction(true);
      },
    }),
    [clearDismissedMapPreviews, setShowMapListingPreviewsAction],
  );

  const onDismissMapPreview = useCallback(
    (propertyId: string) => {
      if (!isDev) return;
      dismissMapListingPreviewAction(propertyId);
    },
    [isDev, dismissMapListingPreviewAction],
  );

  return {
    isDev,
    mapListingPreviewsEnabled,
    dismissedMapPreviewIds,
    mapPreviewSearchLifecycle,
    onDismissMapPreview,
  };
}
