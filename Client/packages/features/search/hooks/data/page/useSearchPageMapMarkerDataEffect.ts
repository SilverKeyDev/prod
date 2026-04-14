import { type RefObject,useEffect, useRef } from "react";

import type { SearchResult } from "@/features/search/types";

type Params = {
  googleMapRef: RefObject<google.maps.Map | null>;
  filteredSearchResults: SearchResult[];
  savedHomes: SearchResult[];
  activeTab: "results" | "saved";
  currentPage: number;
  mapHomeCardsCount: number;
  mapListingPreviewsEnabled: boolean;
  dismissedMapPreviewIds: string[];
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
  updateMapMarkers,
}: Params) {
  const prevDataRef = useRef({
    resultsLength: 0,
    savedLength: 0,
    activeTab: "results" as "results" | "saved",
    currentPage: 0,
    mapHomeCardsCount,
  });

  useEffect(() => {
    if (!googleMapRef.current) return;

    const hasData = filteredSearchResults.length > 0 || savedHomes.length > 0;
    const dataChanged =
      prevDataRef.current.resultsLength !== filteredSearchResults.length ||
      prevDataRef.current.savedLength !== savedHomes.length ||
      prevDataRef.current.activeTab !== activeTab ||
      prevDataRef.current.currentPage !== currentPage ||
      prevDataRef.current.mapHomeCardsCount !== mapHomeCardsCount;

    if (hasData && dataChanged) {
      const currentData =
        activeTab === "results" ? filteredSearchResults : savedHomes;
      void updateMapMarkers(currentData);
      prevDataRef.current = {
        resultsLength: filteredSearchResults.length,
        savedLength: savedHomes.length,
        activeTab,
        currentPage,
        mapHomeCardsCount,
      };
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
    googleMapRef,
    updateMapMarkers,
  ]);
}
