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

// Cache for property centers to ensure consistent positioning with random offsets
const propertyCenterCache = new Map<string, { lat: number; lng: number }>();

// Utility function to calculate map center for property card positioning
export const calculatePropertyCardCenter = (lat: number, lng: number, propertyId?: string) => {
  // If we have a property ID, check cache first for consistent positioning
  if (propertyId) {
    const cached = propertyCenterCache.get(propertyId);
    if (cached) {
      console.log("🗺️ [CENTER CACHE HIT]", {
        propertyId,
        cachedCenter: cached,
        cacheSize: propertyCenterCache.size,
      });
      return cached;
    }
  }

  // Position marker lower on screen (toward bottom) by moving map center north
  // Moving center north makes the property appear south (lower) on screen
  const latOffset = 0.012; // Offset to position marker in lower portion of screen
  
  const center = {
    lat: lat + latOffset,  // Move center north so marker appears lower
    lng: lng,              // Keep longitude centered
  };

  console.log("🗺️ [CENTER CALCULATION]", {
    propertyId: propertyId || "none",
    baseLat: lat,
    baseLng: lng,
    latOffset: latOffset,
    finalLat: center.lat,
    finalLng: center.lng,
    note: "Center moved north to position marker lower on screen",
  });

  // Cache the center if we have a property ID
  if (propertyId) {
    propertyCenterCache.set(propertyId, center);
  }

  return center;
};

export const useMapZoomController = ({
  googleMapRef,
  activeTab,
  searchResults,
  savedHomes,
  currentPage,
}: MapZoomControllerProps) => {
  // Calculate map center positioned so property card appears 25% up from bottom with random left/right offset
  // Caches the center per property ID to ensure consistent positioning
  const calculateMapCenter = useCallback(() => {
    if (!googleMapRef.current) return null;

    const currentData = activeTab === "results" ? searchResults : savedHomes;
    const currentProperty = currentData[currentPage];

    // If we have a current property, center so the card appears 25% up from bottom
    if (currentProperty?.lat && currentProperty?.lng) {
      // Pass property ID for caching to ensure same property gets same random offset
      return calculatePropertyCardCenter(
        currentProperty.lat, 
        currentProperty.lng, 
        currentProperty.id
      );
    }

    return null;
  }, [activeTab, currentPage, googleMapRef, searchResults, savedHomes]);

  // Focus map on current property with default zoom
  const focusOnCurrentProperty = useCallback(() => {
    console.log("🎯 [FOCUS] focusOnCurrentProperty called");
    if (!googleMapRef.current) return;

    const center = calculateMapCenter();
    console.log("🎯 [FOCUS] Center calculated:", center);
    if (center) {
      googleMapRef.current.setCenter(center);
      googleMapRef.current.setZoom(DEFAULT_ZOOM);
      console.log("🎯 [FOCUS] Map centered and zoomed to", DEFAULT_ZOOM);
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
