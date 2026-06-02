import { useMemo } from "react";

import type { MapPreviewSearchLifecycleHooks } from "packages/features/search/api/propertySearchTypes";
import { applyFocusResultsTabAfterSearchComplete } from "packages/features/search/utils/ui/searchResultsTabAfterSearch";
import { useConsolidatedSearchStore, useFiltersStore } from "packages/store";

/**
 * Map preview lifecycle hooks shared by web map search and mobile search execution.
 * On committed results: re-enable previews and focus the Results tab when the user was on Saved.
 */
export function useSearchMapPreviewSearchLifecycle(): MapPreviewSearchLifecycleHooks {
  const clearDismissedMapPreviews = useFiltersStore((s) => s.clearDismissedMapPreviews);
  const activeTab = useConsolidatedSearchStore((s) => s.activeTab);
  const setActiveTab = useConsolidatedSearchStore((s) => s.setActiveTab);
  const setCurrentPage = useConsolidatedSearchStore((s) => s.setCurrentPage);

  return useMemo(
    () => ({
      onSearchStartClearDismissals: clearDismissedMapPreviews,
      onResultsCommittedEnablePreviews: () => {
        clearDismissedMapPreviews();
        applyFocusResultsTabAfterSearchComplete({
          activeTab,
          setActiveTab,
          setCurrentPage,
        });
      },
    }),
    [activeTab, clearDismissedMapPreviews, setActiveTab, setCurrentPage]
  );
}
