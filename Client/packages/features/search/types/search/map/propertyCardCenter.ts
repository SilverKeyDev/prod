import { log } from "packages/logger";
import { screenPx } from "packages/ui/types/screens";
import { getWindow } from "packages/utils/core/platform";

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
export const calculatePropertyCardCenter = (lat: number, lng: number, propertyId?: string) => {
  // Detect if mobile (using same breakpoint as other parts of the codebase)
  const lgPx = screenPx("lg");
  const win = getWindow();
  const isMobile = win != null && Number.isFinite(lgPx) && win.innerWidth < lgPx;

  // Create cache key that includes device type to ensure correct offset per device
  const cacheKey = propertyId ? `${propertyId}:${isMobile ? "mobile" : "desktop"}` : undefined;

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

  const randomLatOffset = seededRandom(randomLatSeed) * (isMobile ? 0.001 : 0.003); // Should be less than Lng offset so it isnt going off the screen
  const randomLngOffset = seededRandom(randomLngSeed) * (isMobile ? 0.004 : 0.015);

  const center = {
    lat: lat + baseNorthOffset + randomLatOffset, // Base northward offset + random north/south
    lng: lng + randomLngOffset, // Random east/west offset
  };

  log.debug("MAP_RENDERING", "🗺️ [CENTER CALCULATION]", {
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
