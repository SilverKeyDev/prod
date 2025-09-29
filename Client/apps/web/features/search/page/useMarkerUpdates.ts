import React, { useEffect } from "react";

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
  // Simple implementation that doesn't require complex map marker management
  // This is a placeholder implementation that can be enhanced later
  const refreshMarkers = (current?: SearchResult) => {
    // For now, this is a no-op implementation
    // The actual marker management should be handled by the parent component
    console.log("refreshMarkers called with:", current);
  };

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
  }, [
    params.activeTab,
    params.currentPage,
    params.hasSearched,
    params.showPropertyModals,
    params.searchResults,
    params.savedHomes,
  ]);

  return { refreshMarkers };
}
