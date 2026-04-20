import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { SavedHome } from "packages/types/domain/savedHome";
import { isLikelyInternalAppListingKey } from "packages/utils/property/listingIdentifier";
import type { PropertySearchListingPriceSource } from "packages/utils/search/pricing/formatPropertySearchListingPrice";
import { formatPropertySearchListingPrice } from "packages/utils/search/pricing/formatPropertySearchListingPrice";

// Raw home data structure from API
export interface RawHomeData {
  address?: string;
  price?: string;
  beds?: string;
  baths?: string;
  sqft?: string | number;
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
    home_id?: string;
    address?: string;
    price?: string;
    beds?: string;
    baths?: string;
    bedrooms?: number | string;
    bathrooms?: number | string;
    sqft?: string | number;
    lot_size?: string;
    image_url?: string;
    lat?: number | string;
    lng?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    lon?: number | string;
    zpid?: string;
    mls_home_id?: string;
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

  const rawData =
    homeData.raw_data && typeof homeData.raw_data === "object" && !Array.isArray(homeData.raw_data)
      ? (homeData.raw_data as Record<string, unknown>)
      : null;
  const listingSource = {
    ...(rawData ?? {}),
    price: (homeData.price as string | number | null | undefined) ?? rawData?.price ?? null,
  } as PropertySearchListingPriceSource;
  const resolvedPrice = formatPropertySearchListingPrice(listingSource);
  const priceString =
    resolvedPrice !== "Price not available"
      ? resolvedPrice
      : typeof homeData.price === "string" && homeData.price.trim() !== ""
        ? homeData.price
        : "";

  const zpidRaw = typeof homeData.zpid === "string" ? homeData.zpid.trim() : "";
  const mlsRaw = typeof homeData.mls_home_id === "string" ? homeData.mls_home_id.trim() : "";

  const resolvedHomeId = (() => {
    if (zpidRaw !== "") return zpidRaw;
    if (mlsRaw !== "") return mlsRaw;

    const hid = typeof homeData.home_id === "string" ? homeData.home_id.trim() : "";
    const idv = typeof homeData.id === "string" ? homeData.id.trim() : "";

    if (hid !== "" && !isLikelyInternalAppListingKey(hid)) return hid;
    if (idv !== "" && !isLikelyInternalAppListingKey(idv)) return idv;
    if (hid !== "") return hid;
    if (idv !== "") return idv;

    if (typeof homeData.address === "string" && homeData.address.trim() !== "") {
      return homeData.address.trim();
    }
    return `home_${index}_${Date.now()}`;
  })();

  return {
    home_id: resolvedHomeId,
    ...(zpidRaw !== "" ? { zpid: zpidRaw } : {}),
    ...(mlsRaw !== "" ? { mls_home_id: mlsRaw } : {}),
    description: homeData.address ?? "",
    address: homeData.address ?? "",
    price: priceString,
    bedrooms: (() => {
      if (homeData.beds != null && String(homeData.beds).trim() !== "") {
        const parsed = Number.parseInt(String(homeData.beds).replace(/,/g, ""), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      if (typeof homeData.bedrooms === "number" && Number.isFinite(homeData.bedrooms)) {
        return Math.trunc(homeData.bedrooms);
      }
      if (typeof homeData.bedrooms === "string" && homeData.bedrooms.trim() !== "") {
        const parsed = Number.parseInt(homeData.bedrooms.replace(/,/g, ""), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    })(),
    bathrooms: (() => {
      if (homeData.baths != null && String(homeData.baths).trim() !== "") {
        const parsed = Number.parseInt(String(homeData.baths).replace(/,/g, ""), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      if (typeof homeData.bathrooms === "number" && Number.isFinite(homeData.bathrooms)) {
        return Math.trunc(homeData.bathrooms);
      }
      if (typeof homeData.bathrooms === "string" && homeData.bathrooms.trim() !== "") {
        const parsed = Number.parseInt(homeData.bathrooms.replace(/,/g, ""), 10);
        return isNaN(parsed) ? undefined : parsed;
      }
      return undefined;
    })(),
    sqft: (() => {
      const rawSqft = homeData.sqft;
      if (rawSqft === undefined || rawSqft === null || rawSqft === "") return undefined;
      if (typeof rawSqft === "number" && Number.isFinite(rawSqft)) {
        const n = Math.trunc(rawSqft);
        return n > 0 ? n : undefined;
      }
      if (typeof rawSqft === "string" && rawSqft.trim() === "") return undefined;
      const parsed = Number.parseInt(String(rawSqft).replace(/,/g, ""), 10);
      return isNaN(parsed) || parsed <= 0 ? undefined : parsed;
    })(),
    lot_size: homeData.lot_size ?? "",
    image_url: homeData.image_url ?? undefined,
    lat,
    lng,
    _databaseId: homeData.id,
  };
}
