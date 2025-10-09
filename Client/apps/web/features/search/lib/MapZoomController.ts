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

// Utility function to calculate map center for property card positioning
export const calculatePropertyCardCenter = (lat: number, lng: number) => {
  // Position card 25% up from bottom with random left/right offset
  const latOffset = 0.015; // 25% up from bottom
  const offset = (Math.random() - 0.5) * 0.002; // Random left/right offset (-0.001 to +0.001)
  
  return {
    lat: lat + latOffset - offset,
    lng: lng + offset,
  };
};

export const useMapZoomController = ({
  googleMapRef,
  activeTab,
  searchResults,
  savedHomes,
  currentPage,
}: MapZoomControllerProps) => {
  // Calculate map center positioned so property card appears 25% up from bottom with random left/right offset
  const calculateMapCenter = useCallback(() => {
    if (!googleMapRef.current) return null;

    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const currentProperty = currentData[currentPage];

    // If we have a current property, center so the card appears 25% up from bottom
    if (currentProperty?.lat && currentProperty?.lng) {
      return calculatePropertyCardCenter(currentProperty.lat, currentProperty.lng);
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
