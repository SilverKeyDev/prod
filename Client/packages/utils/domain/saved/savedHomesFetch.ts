/**
 * Helpers for saved homes fetch and cache checks. Extracted to satisfy max-lines-per-function and complexity.
 */

import { log, LOG_CATEGORIES } from "logger";

import type { SavedHome } from "packages/schemas";
import { getWindow } from "packages/utils/core/platform";

import type { RawHomeData } from "./savedHomeMappers";

/** Type guard: true if data is an array of processed SavedHome objects */
export function isProcessedSavedHomeList(data: unknown): data is SavedHome[] {
  if (!data || !Array.isArray(data) || data.length === 0) return false;
  return data.every(
    (home: unknown) =>
      home &&
      typeof home === "object" &&
      "home_id" in home &&
      "address" in home,
  );
}

interface GoogleMapsGeocoder {
  geocode(request: { address: string }): Promise<{
    results: Array<{
      geometry: {
        location: {
          lat: number | (() => number);
          lng: number | (() => number);
        };
      };
    }>;
  }>;
}

interface WindowWithGoogle {
  google?: { maps?: { Geocoder?: new () => GoogleMapsGeocoder } };
}

function hasValidCoordinates(latNum: number, lngNum: number): boolean {
  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180 &&
    !(latNum === 0 && lngNum === 0)
  );
}

/** Geocode a single raw home if it lacks valid coordinates. Returns enriched home or original. */
export async function enrichOneRawHomeWithGeocoding(
  home: RawHomeData,
  index: number,
): Promise<RawHomeData> {
  const existingLat = home?.lat ?? home?.latitude;
  const existingLng =
    home?.lng ?? home?.longitude ?? (home as { lon?: number }).lon;
  const latNum =
    typeof existingLat === "number" ? existingLat : Number(existingLat);
  const lngNum =
    typeof existingLng === "number" ? existingLng : Number(existingLng);

  if (hasValidCoordinates(latNum, lngNum)) {
    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "🗺️ [SAVED HOMES] Using existing valid coordinates for saved home",
      { index, address: home.address, lat: existingLat, lng: existingLng },
    );
    return home;
  }

  try {
    const win = getWindow() as unknown as WindowWithGoogle | null;
    if (!win?.google?.maps?.Geocoder || !home?.address) return home;

    const geocoder = new win.google.maps.Geocoder();
    const result = await geocoder.geocode({ address: home.address });
    const location = result?.results?.[0]?.geometry?.location;
    if (!location) return home;

    const lat =
      typeof location.lat === "function" ? location.lat() : location.lat;
    const lng =
      typeof location.lng === "function" ? location.lng() : location.lng;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return home;

    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "🗺️ [SAVED HOMES] Geocoded coordinates for saved home",
      { address: home.address, lat, lng },
    );
    return { ...home, lat, lng };
  } catch {
    return home;
  }
}

/** Enrich raw homes with geocoding where coordinates are missing. */
export async function enrichRawHomesWithGeocoding(
  rawHomes: RawHomeData[],
): Promise<RawHomeData[]> {
  return Promise.all(
    rawHomes.map((home, index) => enrichOneRawHomeWithGeocoding(home, index)),
  );
}

/** Find a SavedHome by id or by address (normalized). */
export function findSavedHomeByIdOrAddress(
  homes: SavedHome[],
  propertyId: string,
  propertyAddress?: string,
): SavedHome | undefined {
  const home = homes.find((h) => h.home_id === propertyId);
  if (home) return home;
  if (propertyAddress && typeof propertyAddress === "string") {
    const normalized = propertyAddress.toLowerCase();
    return homes.find((h) => {
      const addr = typeof h.address === "string" ? h.address.toLowerCase() : "";
      return addr === normalized;
    });
  }
  return undefined;
}
