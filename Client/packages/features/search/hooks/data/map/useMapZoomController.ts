import { type MutableRefObject, useCallback } from "react";

import { calculatePropertyCardCenter } from "packages/features/search/types/search/map/propertyCardCenter";
import {
  adjustMapZoomByDelta,
  applyListingFocusCamera,
} from "packages/features/search/utils/googleMaps/mapCamera";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SearchResult } from "packages/types";

export type MapZoomControllerProps = {
  googleMapRef: MutableRefObject<google.maps.Map | null>;
  activeTab: string;
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
};

export {
  DEFAULT_ZOOM,
  SEARCH_MAP_LISTING_FOCUS_ZOOM,
} from "packages/features/search/utils/googleMaps/mapCamera";

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
        currentProperty.id
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
        }
      );
      applyListingFocusCamera(googleMapRef.current, center);
    }
  }, [activeTab, calculateMapCenter, currentPage, googleMapRef, savedHomes, searchResults]);

  const resetToDefaultZoom = useCallback(() => {
    if (!googleMapRef.current) return;
    focusOnCurrentProperty();
  }, [focusOnCurrentProperty, googleMapRef]);

  const zoomIn = useCallback(() => {
    const map = googleMapRef.current;
    if (map) {
      adjustMapZoomByDelta(map, 1);
    }
  }, [googleMapRef]);

  const zoomOut = useCallback(() => {
    const map = googleMapRef.current;
    if (map) {
      adjustMapZoomByDelta(map, -1);
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
