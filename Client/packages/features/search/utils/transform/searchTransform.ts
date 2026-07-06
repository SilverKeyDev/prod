/**
 * Search transform utilities: map API results to SearchResult format.
 */
import { getEnv } from "packages/config/env";
import { log } from "packages/logger";
import type { PropertySearchResult, SearchByPolygonResponse } from "packages/types/domain/api";
import { formatPropertySearchListingPrice } from "packages/utils/product/search/pricing/formatPropertySearchListingPrice";

import type { SearchResult } from "@/features/search/types";

function isOpenApiPropertySearchResult(p: unknown): p is PropertySearchResult {
  return (
    typeof p === "object" &&
    p !== null &&
    "essentials" in p &&
    "location" in p &&
    typeof (p as PropertySearchResult).id === "string"
  );
}

/**
 * Transform PropertySearchResult from API to SearchResult format
 */
export function transformPropertySearchResult(
  property: PropertySearchResult,
  index: number,
  fallbackCenter?: { lat: number; lng: number }
): SearchResult {
  if (!isOpenApiPropertySearchResult(property)) {
    log.warn("SEARCH", "search_transform_unexpected_property_shape", { index });
    return {
      id: `invalid-${index}`,
      address: "Address not available",
      price: "",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      lat: fallbackCenter?.lat ?? 0,
      lng: fallbackCenter?.lng ?? 0,
      propertyType: "Single Family",
      listingStatus: "FOR_SALE",
      imageUrl: "/default-home.jpg",
      _score: 0,
    };
  }

  const score = property.score ?? 0;
  const isDev = getEnv().isDevelopment;
  if (index < 5) {
    log.debug("MAP_RENDERING", "[SEARCH TRANSFORM] Property coordinates (OpenAPI nested)", {
      environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
      index,
      id: property.id,
      address: property.location.address,
      rawLatitude: property.location.latitude,
      rawLongitude: property.location.longitude,
      fallbackCenter,
    });
  }

  const lat = property.location.latitude ?? fallbackCenter?.lat ?? 0;
  const lng = property.location.longitude ?? fallbackCenter?.lng ?? 0;
  const listingId = property.id;
  const homeId =
    "home_id" in property && typeof property.home_id === "string" && property.home_id.trim()
      ? property.home_id.trim()
      : undefined;
  const zpidSource = listingId ?? homeId ?? "";
  const zpidNum = /^\d+$/.test(zpidSource) ? parseInt(zpidSource, 10) : undefined;

  return {
    id: homeId ?? listingId ?? `${Date.now()}-${index}`,
    ...(homeId ? { home_id: homeId } : {}),
    address: property.location.address || "Address not available",
    price: formatPropertySearchListingPrice({
      price: property.financials?.price ?? undefined,
    }),
    bedrooms: property.essentials.bedrooms ?? 0,
    bathrooms: property.essentials.bathrooms ?? 0,
    sqft: property.essentials.livingAreaSqft ?? 0,
    lat,
    lng,
    propertyType: property.metadata?.homeType ?? "Single Family",
    listingStatus: property.metadata?.listingStatus ?? "FOR_SALE",
    imageUrl: property.media?.primaryImageUrl ?? "/default-home.jpg",
    _score: score,
    zpid: zpidNum,
  };
}

/**
 * Transform SearchByPolygonResponse to SearchResult array
 */
export function transformSearchResponse(
  response: SearchByPolygonResponse,
  fallbackCenter?: { lat: number; lng: number }
): SearchResult[] {
  if (!response.success || !response.properties) {
    log.warn("SEARCH", "Search response has no properties", {
      success: response.success,
      error: response.error,
    });
    return [];
  }

  const mapped = response.properties.map((property, index) =>
    transformPropertySearchResult(property as PropertySearchResult, index, fallbackCenter)
  );
  const seen = new Set<string>();
  const deduped: SearchResult[] = [];
  mapped.forEach((row, index) => {
    const key = String(row.home_id ?? row.id ?? row.zpid ?? "") || `anon_${index}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    deduped.push(row);
  });
  log.info("SEARCH", "transformSearchResponse: mapped API properties to SearchResult", {
    inputCount: response.properties.length,
    outputCount: deduped.length,
    metaCached: (response as SearchByPolygonResponse & { meta?: { cached?: boolean } }).meta
      ?.cached,
  });
  return deduped;
}
