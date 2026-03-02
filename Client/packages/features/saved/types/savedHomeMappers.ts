import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";

import type { SavedHome } from "./savedHome";

// Raw home data structure from API
export interface RawHomeData {
  address?: string;
  price?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  lot_size?: string;
  image_url?: string;
  lat?: number | string;
  lng?: number | string;
  latitude?: number | string;
  longitude?: number | string;
  lon?: number | string;
  [key: string]: unknown;
}

// Property data structure for mutations
export interface PropertyData {
  id?: string;
  home_id?: string;
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: string;
  imageUrl?: string;
  image_url?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

/**
 * Map home data to SavedHome format. Expects API shape with optional id, address, price,
 * beds, baths, sqft, lot_size, image_url; lat/lng from lat|latitude and lng|longitude|lon,
 * validated to valid lat/lng ranges.
 */
export function mapHomeUniversalToSavedHome(home: unknown, index: number): SavedHome {
  const homeData = home as {
    id?: string;
    address?: string;
    price?: string;
    beds?: string;
    baths?: string;
    sqft?: string;
    lot_size?: string;
    image_url?: string;
    lat?: number | string;
    lng?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    lon?: number | string;
    [key: string]: unknown;
  };

  const rawLat = homeData.lat ?? homeData.latitude;
  const rawLng = homeData.lng ?? homeData.longitude ?? homeData.lon;
  const latNum = typeof rawLat === "number" ? rawLat : Number(rawLat);
  const lngNum = typeof rawLng === "number" ? rawLng : Number(rawLng);
  const validLat = Number.isFinite(latNum) && latNum >= -90 && latNum <= 90;
  const validLng = Number.isFinite(lngNum) && lngNum >= -180 && lngNum <= 180;
  const lat = validLat ? latNum : undefined;
  const lng = validLng ? lngNum : undefined;

  const isDev = getEnv().isDevelopment;
  if (index < 10) {
    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "🗺️ [SAVED HOMES] Normalizing coordinates for saved home",
      {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        index,
        id: homeData.id,
        address: homeData.address,
        rawLat,
        rawLng,
        latNum,
        lngNum,
        validLat,
        validLng,
        finalLat: lat,
        finalLng: lng,
      }
    );
  }

  return {
    home_id: homeData.address ?? `home_${index}_${Date.now()}`,
    description: homeData.address ?? "",
    address: homeData.address ?? "",
    price: homeData.price ?? "",
    bedrooms: (() => {
      const parsed = Number.parseInt(homeData.beds ?? "0");
      return isNaN(parsed) ? undefined : parsed;
    })(),
    bathrooms: (() => {
      const parsed = Number.parseInt(homeData.baths ?? "0");
      return isNaN(parsed) ? undefined : parsed;
    })(),
    sqft: (() => {
      const rawSqft = homeData.sqft ?? "";
      if (typeof rawSqft === "string" && rawSqft.trim() === "") return undefined;
      const parsed = Number.parseInt(rawSqft.replace(/,/g, ""), 10);
      return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
    })(),
    lot_size: homeData.lot_size ?? "",
    image_url: homeData.image_url ?? undefined,
    lat,
    lng,
    _databaseId: homeData.id,
  };
}
