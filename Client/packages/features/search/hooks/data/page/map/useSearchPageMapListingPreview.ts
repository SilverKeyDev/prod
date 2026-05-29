import { useCallback } from "react";

import { useSearchMapPreviewSearchLifecycle } from "packages/features/search/hooks/ui/useSearchMapPreviewSearchLifecycle";
import { useFiltersStore } from "packages/store";

export function useSearchPageMapListingPreview() {
  const dismissedMapPreviewIds = useFiltersStore((s) => s.dismissedMapPreviewIds);
  const dismissMapListingPreviewAction = useFiltersStore((s) => s.dismissMapListingPreview);
  const mapListingPreviewsEnabled = true;
  const mapPreviewSearchLifecycle = useSearchMapPreviewSearchLifecycle();

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
