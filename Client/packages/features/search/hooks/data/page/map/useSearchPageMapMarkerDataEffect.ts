import { type RefObject, useEffect, useRef } from "react";

import type { SearchViewMode } from "packages/store";

import type { SearchResult } from "@/features/search/types";

function dismissedPreviewKey(ids: string[]): string {
  if (ids.length === 0) return "";
  return [...ids].sort().join("\0");
}

type Params = {
  googleMapRef: RefObject<google.maps.Map | null>;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  activeTab: "results" | "saved";
  currentPage: number;
  mapHomeCardsCount: number;
  mapListingPreviewsEnabled: boolean;
  dismissedMapPreviewIds: string[];
  searchViewMode: SearchViewMode;
  updateMapMarkers: (data: SearchResult[]) => void | Promise<void>;
};

export function useSearchPageMapMarkerDataEffect({
  googleMapRef,
  filteredSearchResults,
  savedHomes,
  activeTab,
  currentPage,
  mapHomeCardsCount,
  mapListingPreviewsEnabled,
  dismissedMapPreviewIds,
  searchViewMode,
  updateMapMarkers,
}: Params) {
  const mapVisible = searchViewMode === "map";
  const pendingFlushRef = useRef<SearchResult[] | null>(null);
  const prevDataRef = useRef({
    resultsLength: 0,
    savedLength: 0,
    activeTab: "results" as "results" | "saved",
    currentPage: 0,
    mapHomeCardsCount,
    dismissedKey: "",
    mapListingPreviewsEnabled,
  });

  useEffect(() => {
    if (!googleMapRef.current) return;

    const dismissedKey = dismissedPreviewKey(dismissedMapPreviewIds);
    const dataChanged =
      prevDataRef.current.resultsLength !== filteredSearchResults.length ||
      prevDataRef.current.savedLength !== savedHomes.length ||
      prevDataRef.current.activeTab !== activeTab ||
      prevDataRef.current.currentPage !== currentPage ||
      prevDataRef.current.mapHomeCardsCount !== mapHomeCardsCount ||
      prevDataRef.current.dismissedKey !== dismissedKey ||
      prevDataRef.current.mapListingPreviewsEnabled !== mapListingPreviewsEnabled;

    const currentData = activeTab === "results" ? filteredSearchResults : savedHomes;

    const syncPrev = () => {
      prevDataRef.current = {
        resultsLength: filteredSearchResults.length,
        savedLength: savedHomes.length,
        activeTab,
        currentPage,
        mapHomeCardsCount,
        dismissedKey,
        mapListingPreviewsEnabled,
      };
    };

    if (!mapVisible) {
      if (dataChanged) {
        pendingFlushRef.current = currentData;
      }
      return;
    }

    const pending = pendingFlushRef.current;
    if (pending) {
      pendingFlushRef.current = null;
      void updateMapMarkers(pending);
      syncPrev();
      return;
    }

    if (dataChanged) {
      void updateMapMarkers(currentData);
      syncPrev();
    }
  }, [
    filteredSearchResults.length,
    savedHomes.length,
    filteredSearchResults,
    savedHomes,
    activeTab,
    currentPage,
    mapHomeCardsCount,
    mapListingPreviewsEnabled,
    dismissedMapPreviewIds,
    searchViewMode,
    mapVisible,
    googleMapRef,
    updateMapMarkers,
  ]);
}
