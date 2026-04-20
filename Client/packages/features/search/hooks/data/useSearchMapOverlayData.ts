import { useMemo } from "react";

import { buildNeighborhoodPolygonFromLocations } from "packages/features/search/utils/map/neighborhoodPolygon";
import { useFiltersStore, useSearchContextStore } from "packages/store";
import type { IsochroneData } from "packages/types/domain/api";

/**
 * Map overlay precedence:
 * 1. If location search is active (locationSearchOverlayData) → show location/viewport polygon (highest priority for immediate feedback)
 * 2. For preferences search only (not map/location search):
 *    - If showCommute is ON → show commute isochrone (isochroneData)
 *    - If showCommute is OFF → show neighborhood polygon around important locations when available
 * 3. For location/map search with no active place overlay → show nothing (never reuse preferences isochrone here)
 */
export function useSearchMapOverlayData(isochroneData: IsochroneData | null): {
  displayIsochroneData: IsochroneData | null;
} {
  const showCommuteOverlay = useFiltersStore((s) => s.showCommuteOverlay);
  const searchSource = useFiltersStore((s) => s.searchSource);
  const locationSearchOverlayData = useSearchContextStore((s) => s.locationSearchOverlayData);

  const displayIsochroneData = useMemo(() => {
    // Priority 1: If location search overlay exists (location bar search), show it immediately
    // This provides instant visual feedback when users select a location from the dropdown
    if (locationSearchOverlayData) {
      return locationSearchOverlayData;
    }

    if (searchSource !== "preferences") {
      return null;
    }

    if (showCommuteOverlay) {
      return isochroneData;
    }

    if (isochroneData?.locations) {
      return buildNeighborhoodPolygonFromLocations(isochroneData);
    }

    return null;
  }, [showCommuteOverlay, locationSearchOverlayData, searchSource, isochroneData]);

  return { displayIsochroneData };
}
