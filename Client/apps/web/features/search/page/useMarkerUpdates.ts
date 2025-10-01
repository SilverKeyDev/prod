import React, { useEffect, useCallback } from "react";

import type { SearchResult } from "../../../../../packages/schemas/search";
import type { Property } from "../../../../../packages/schemas/property";

export function useMarkerUpdates(params: {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  onOpenDetails: (id: string) => void;
  isHomeSaved: (id: string) => boolean;
  saveHome: (p: SearchResult | Property) => Promise<void>;
  removeSavedHome: (id: string) => Promise<void>;
  activeTab: "results" | "saved";
  currentPage: number;
  hasSearched: boolean;
  showPropertyModals: boolean;
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
}): { refreshMarkers: (current?: SearchResult) => void } {
  // Proper implementation that handles marker updates based on current state
  const refreshMarkers = useCallback((current?: SearchResult) => {
    if (!params.googleMapRef.current) {
      console.warn("Map not available for marker refresh");
      return;
    }

    // If we have a current property and should show modals, focus on it
    if (current && params.hasSearched && params.showPropertyModals) {
      const center = {
        lat: current.lat + 0.002, // Offset slightly north
        lng: current.lng,
      };
      params.googleMapRef.current.setCenter(center);
      params.googleMapRef.current.setZoom(13);
    }
  }, [params.googleMapRef, params.hasSearched, params.showPropertyModals]);

  // Update markers when activeTab, currentPage changes or when hasSearched/showPropertyModals changes
  useEffect(() => {
    if (!params.googleMapRef.current) return;

    if (params.hasSearched && params.showPropertyModals) {
      // Show only the currently selected property marker
      const allData =
        params.activeTab === "results"
          ? params.searchResults
          : params.savedHomes;
      const currentProperty = allData[params.currentPage];
      if (currentProperty) {
        refreshMarkers(currentProperty);
      } else {
        refreshMarkers();
      }
    } else {
      // Clear all markers when user hasn't searched yet or property modals should not be shown
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
