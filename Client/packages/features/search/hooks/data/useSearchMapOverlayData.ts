import { useMemo } from "react";

import { buildNeighborhoodPolygonFromLocations } from "packages/features/search/utils/neighborhoodPolygon";
import { useFiltersStore, useSearchContextStore } from "packages/store";
import type { IsochroneData } from "packages/types/api";

/**
 * Map overlay precedence:
 * 1. If location search is active (locationSearchOverlayData) → show location/viewport polygon (highest priority for immediate feedback)
 * 2. If showCommute is ON → show commute isochrone (isochroneData)
 * 3. If showCommute is OFF:
 *    - If preferences search (searchSource="preferences") → show neighborhood polygon (simple bounds around important locations)
 *    - Otherwise → show nothing
 */
export function useSearchMapOverlayData(isochroneData: IsochroneData | null): {
  displayIsochroneData: IsochroneData | null;
} {
  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const searchSource = useFiltersStore((s) => s.searchSource);
  const locationSearchOverlayData = useSearchContextStore(
    (s) => s.locationSearchOverlayData,
  );

  const displayIsochroneData = useMemo(() => {
    // Priority 1: If location search overlay exists (location bar search), show it immediately
    // This provides instant visual feedback when users select a location from the dropdown
    if (locationSearchOverlayData) {
      return locationSearchOverlayData;
    }

    // Priority 2: If commute overlay is enabled, show the commute isochrone
    if (showCommuteOverlay) {
      return isochroneData;
    }

    // Priority 3: For preferences search with commute OFF, show neighborhood polygon
    if (searchSource === "preferences" && isochroneData?.locations) {
      return buildNeighborhoodPolygonFromLocations(isochroneData);
    }

    // Otherwise: show nothing
    return null;
  }, [
    showCommuteOverlay,
    locationSearchOverlayData,
    searchSource,
    isochroneData,
  ]);

  return { displayIsochroneData };
}
