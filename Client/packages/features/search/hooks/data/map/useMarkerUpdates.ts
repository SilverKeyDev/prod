import { useCallback, useEffect } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";

import type { SearchResult } from "@/features/search/types";

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
  const refreshMarkers = useCallback(
    (_current?: SearchResult) => {
      if (!params.googleMapRef.current) {
        log.warn(LOG_CATEGORIES.MAP_RENDERING, "Map not available for marker refresh");
        return;
      }
    },
    [params.googleMapRef]
  );

  useEffect(() => {
    if (!params.googleMapRef.current) return;

    if (params.hasSearched && params.showPropertyModals) {
      const allData = params.activeTab === "results" ? params.searchResults : params.savedHomes;
      const currentProperty = allData[params.currentPage];
      if (currentProperty) {
        refreshMarkers(currentProperty);
      } else {
        refreshMarkers();
      }
    } else {
      refreshMarkers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    params.activeTab,
    params.currentPage,
    params.hasSearched,
    params.showPropertyModals,
    params.searchResults,
    params.savedHomes,
    refreshMarkers,
  ]);

  return { refreshMarkers };
}
