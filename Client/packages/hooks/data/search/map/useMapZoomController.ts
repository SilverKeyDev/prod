import { type MutableRefObject, useCallback } from "react";

import { log, LOG_CATEGORIES } from "logger";

import type { SearchResult } from "packages/schemas";
import { calculatePropertyCardCenter } from "packages/utils/domain/search/propertyCardCenter";

export type MapZoomControllerProps = {
  googleMapRef: MutableRefObject<google.maps.Map | null>;
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
  const calculateMapCenter = useCallback(() => {
    if (!googleMapRef.current) return null;

    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const currentProperty = currentData[currentPage];

    if (currentProperty?.lat && currentProperty?.lng) {
      return calculatePropertyCardCenter(
        currentProperty.lat,
        currentProperty.lng,
        currentProperty.id,
      );
    }

    return null;
  }, [activeTab, currentPage, googleMapRef, searchResults, savedHomes]);

  const focusOnCurrentProperty = useCallback(() => {
    if (!googleMapRef.current) return;

    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const currentProperty = currentData[currentPage];
    const center = calculateMapCenter();

    if (center && currentProperty) {
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "🗺️ [MAP FOCUS] Switched to home - coordinates being rendered at",
        {
          propertyId: currentProperty.id,
          address: currentProperty.address,
          coordinates: {
            lat: currentProperty.lat,
            lng: currentProperty.lng,
          },
        },
      );
      googleMapRef.current.setCenter(center);
      googleMapRef.current.setZoom(DEFAULT_ZOOM);
    }
  }, [
    activeTab,
    calculateMapCenter,
    currentPage,
    googleMapRef,
    savedHomes,
    searchResults,
  ]);

  const resetToDefaultZoom = useCallback(() => {
    if (!googleMapRef.current) return;
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
