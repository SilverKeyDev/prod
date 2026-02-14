import { useCallback } from "react";

import type { SearchResult } from "../../../../../packages/schemas/search";
import { screenPx } from "../../../../../packages/schemas/ui/screens";
import { log, LOG_CATEGORIES } from "../../../../../logger";

export type MapZoomControllerProps = {
  googleMapRef: React.MutableRefObject<google.maps.Map | null>;
  activeTab: string;
  searchResults: SearchResult[];
  savedHomes: SearchResult[];
  currentPage: number;
};

export const DEFAULT_ZOOM = 13;

// Cache for property centers to ensure consistent positioning with device-specific offsets
// Key format: "propertyId:mobile" or "propertyId:desktop"
const propertyCenterCache = new Map<string, { lat: number; lng: number }>();

// Generate a deterministic random value between -1 and 1 based on a string seed
// This ensures the same property ID always gets the same random offset
const seededRandom = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Normalize to -1 to 1 range
  return (hash % 10000) / 10000;
};

// Utility function to calculate map center for property card positioning
export const calculatePropertyCardCenter = (
  lat: number,
  lng: number,
  propertyId?: string,
) => {
  // Detect if mobile (using same breakpoint as other parts of the codebase)
  const lgPx = screenPx("lg");
  const isMobile =
    typeof window !== "undefined" &&
    Number.isFinite(lgPx) &&
    window.innerWidth < lgPx;

  // Create cache key that includes device type to ensure correct offset per device
  const cacheKey = propertyId
    ? `${propertyId}:${isMobile ? "mobile" : "desktop"}`
    : undefined;

  // If we have a cache key, check cache first for consistent positioning
  if (cacheKey) {
    const cached = propertyCenterCache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Apply northward offset: slight for desktop, substantial for mobile
  // 0.015 degrees ≈ 1.7 km north (slight offset for desktop)
  // 0.08 degrees ≈ 8.9 km north (substantial offset for mobile)
  const baseNorthOffset = isMobile ? 0.02 : 0.015;

  // Generate deterministic random offsets for north/south and east/west
  // Range: ±0.01 to ±0.02 degrees (≈ ±1.1 to ±2.2 km)
  const randomLatSeed = propertyId ? `${propertyId}:lat` : `${lat}:${lng}:lat`;
  const randomLngSeed = propertyId ? `${propertyId}:lng` : `${lat}:${lng}:lng`;

  const randomLatOffset =
    seededRandom(randomLatSeed) * (isMobile ? 0.001 : 0.003); // Should be less than Lng offset so it isnt going off the screen
  const randomLngOffset =
    seededRandom(randomLngSeed) * (isMobile ? 0.004 : 0.015);

  const center = {
    lat: lat + baseNorthOffset + randomLatOffset, // Base northward offset + random north/south
    lng: lng + randomLngOffset, // Random east/west offset
  };

  log.debug(LOG_CATEGORIES.MAP_RENDERING, "🗺️ [CENTER CALCULATION]", {
    propertyId: propertyId || "none",
    baseLat: lat,
    baseLng: lng,
    isMobile,
    baseNorthOffset,
    randomLatOffset,
    randomLngOffset,
    finalLat: center.lat,
    finalLng: center.lng,
  });

  // Cache the center if we have a cache key
  if (cacheKey) {
    propertyCenterCache.set(cacheKey, center);
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
        currentProperty.id,
      );
    }

    return null;
  }, [activeTab, currentPage, googleMapRef, searchResults, savedHomes]);

  // Focus map on current property with default zoom
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
