import { useCallback } from "react";

import type { SearchResult } from "../../../../../packages/schemas/search";

export type MapZoomControllerProps = {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  activeTab: string;
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
};

export const DEFAULT_ZOOM = 13;

export const useMapZoomController = ({
  googleMapRef,
  activeTab,
  searchResults,
  savedHomes,
  currentPage,
}: MapZoomControllerProps) => {
  // Calculate map center positioned slightly above the property marker
  const calculateMapCenter = useCallback(() => {
    if (!googleMapRef.current) return null;

    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const currentProperty = currentData[currentPage];

    // If we have a current property, center slightly above it
    if (currentProperty?.lat && currentProperty?.lng) {
      // Offset the latitude slightly north to position map above the marker
      // At zoom level 13, approximately 0.002 degrees latitude = ~220 meters
      const latOffset = 0.002;

      return {
        lat: currentProperty.lat + latOffset,
        lng: currentProperty.lng,
      };
    }

    return null;
  }, [activeTab, searchResults, savedHomes, currentPage, googleMapRef]);

  // Focus map on current property with default zoom
  const focusOnCurrentProperty = useCallback(() => {
    if (!googleMapRef.current) return;

    const center = calculateMapCenter();
    if (center) {
      googleMapRef.current.setCenter(center);
      googleMapRef.current.setZoom(DEFAULT_ZOOM);
    }
  }, [calculateMapCenter, googleMapRef]);

  const resetToDefaultZoom = useCallback(() => {
    if (!googleMapRef.current) return;

    // Always focus on current property and set default zoom
    focusOnCurrentProperty();
  }, [focusOnCurrentProperty, googleMapRef]);

  const zoomIn = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() ?? DEFAULT_ZOOM;
      googleMapRef.current.setZoom(currentZoom + 1);
    }
  }, [googleMapRef]);

  const zoomOut = useCallback(() => {
    if (googleMapRef.current) {
      const currentZoom = googleMapRef.current.getZoom() ?? DEFAULT_ZOOM;
      googleMapRef.current.setZoom(currentZoom - 1);
    }
  }, [googleMapRef]);

  return {
    resetToDefaultZoom,
    zoomIn,
    zoomOut,
    focusOnCurrentProperty,
    calculateMapCenter,
  };
};
