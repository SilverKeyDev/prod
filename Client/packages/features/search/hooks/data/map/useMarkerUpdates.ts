import { useCallback, useEffect } from "react";

import type { SearchResult } from "packages/features/search/types";
import { log } from "packages/logger";

export function useMarkerUpdates(params: {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  onOpenDetails: (id: string) => void;
  activeTab: "results" | "saved";
  currentPage: number;
  hasSearched: boolean;
  showPropertyModals: boolean;
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
}): { refreshMarkers: (_current?: SearchResult) => void } {
  const {
    googleMapRef,
    activeTab,
    currentPage,
    hasSearched,
    showPropertyModals,
    searchResults,
    savedHomes,
  } = params;

  const refreshMarkers = useCallback(
    (_current?: SearchResult) => {
      if (!googleMapRef.current) {
        log.warn("MAP_RENDERING", "Map not available for marker refresh");
        return;
      }
    },
    [googleMapRef]
  );

  useEffect(() => {
    if (!googleMapRef.current) return;

    if (hasSearched && showPropertyModals) {
      const allData = activeTab === "results" ? searchResults : savedHomes;
      const currentProperty = allData[currentPage];
      if (currentProperty) {
        refreshMarkers(currentProperty);
      } else {
        refreshMarkers();
      }
    } else {
      refreshMarkers();
    }
  }, [
    activeTab,
    currentPage,
    googleMapRef,
    hasSearched,
    refreshMarkers,
    savedHomes,
    searchResults,
    showPropertyModals,
  ]);

  return { refreshMarkers };
}
