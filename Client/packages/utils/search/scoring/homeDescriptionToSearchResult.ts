import type { SearchResult } from "packages/features/search/types/result";
import {
  formatFilenameToAddress,
  formatLotSize,
} from "packages/features/search/types/search/formatters/address";
import type { HomeDescription } from "packages/ui/components/cards/HomeCard";
import { formatPropertySearchListingPrice } from "packages/utils/search/pricing/formatPropertySearchListingPrice";

const FALLBACK_LAT = 37.7749;
const FALLBACK_LNG = -122.4194;

function normalizedMatchScore(score: unknown): number | undefined {
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return undefined;
  }
  if (score <= 0 || score > 100) {
    return undefined;
  }
  return Math.max(0, Math.min(100, score));
}

/** Maps merged shared-home / saved-home snapshot data to SearchResult for search listing cards. */
export function homeDescriptionToSearchResult(home: HomeDescription): SearchResult {
  const formattedAddress = formatFilenameToAddress(home.home_id);
  const address = home.address ?? formattedAddress ?? home.home_id;
  const lat = typeof home.lat === "number" && Number.isFinite(home.lat) ? home.lat : FALLBACK_LAT;
  const lng = typeof home.lng === "number" && Number.isFinite(home.lng) ? home.lng : FALLBACK_LNG;
  const hasLot =
    home.lot_size !== undefined &&
    home.lot_size !== null &&
    home.lot_size !== "" &&
    !(typeof home.lot_size === "number" && !Number.isFinite(home.lot_size));
  const lotSizeRaw = hasLot
    ? formatLotSize(home.lot_size as string | number | undefined)
    : undefined;
  const lotSize = lotSizeRaw && lotSizeRaw !== "N/A" ? lotSizeRaw : undefined;
  const imageUrl = typeof home.image_url === "string" ? home.image_url : undefined;
  const zpidRaw = typeof home.zpid === "string" ? home.zpid.trim() : "";
  const mlsRaw = typeof home.mls_home_id === "string" ? home.mls_home_id.trim() : "";
  const zpidForResult: number | string | undefined =
    zpidRaw !== "" ? (/^\d+$/.test(zpidRaw) ? parseInt(zpidRaw, 10) : zpidRaw) : undefined;
  const bedrooms =
    typeof home.bedrooms === "number" && Number.isFinite(home.bedrooms) ? home.bedrooms : 0;
  const bathrooms =
    typeof home.bathrooms === "number" && Number.isFinite(home.bathrooms) ? home.bathrooms : 0;
  const sqft =
    typeof home.sqft === "number" && Number.isFinite(home.sqft) && home.sqft > 0 ? home.sqft : 0;

  return {
    id: home.home_id,
    address,
    price: formatPropertySearchListingPrice({ price: home.price }),
    bedrooms,
    bathrooms,
    sqft,
    lat,
    lng,
    lotSize,
    imageUrl,
    images: imageUrl ? [imageUrl] : undefined,
    _score: normalizedMatchScore(home.calculatedScore),
    ...(zpidForResult !== undefined ? { zpid: zpidForResult } : {}),
    ...(mlsRaw !== "" ? { mls_home_id: mlsRaw } : {}),
  };
}
