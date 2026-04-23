import { useCallback, useMemo } from "react";

import { useFiltersStore } from "packages/store";

export function useSearchPageMapListingPreview() {
  const dismissedMapPreviewIds = useFiltersStore((s) => s.dismissedMapPreviewIds);
  const clearDismissedMapPreviews = useFiltersStore((s) => s.clearDismissedMapPreviews);
  const dismissMapListingPreviewAction = useFiltersStore((s) => s.dismissMapListingPreview);
  const mapListingPreviewsEnabled = true;

  const mapPreviewSearchLifecycle = useMemo(
    () => ({
      onSearchStartClearDismissals: clearDismissedMapPreviews,
      onResultsCommittedEnablePreviews: () => {
        clearDismissedMapPreviews();
      },
    }),
    [clearDismissedMapPreviews]
  );

  const onDismissMapPreview = useCallback(
    (propertyId: string) => {
      dismissMapListingPreviewAction(propertyId);
    },
    [dismissMapListingPreviewAction]
  );

  return {
    mapListingPreviewsEnabled,
    dismissedMapPreviewIds,
    mapPreviewSearchLifecycle,
    onDismissMapPreview,
  };
}
