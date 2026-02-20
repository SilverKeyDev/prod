/**
 * Search service for transforming and managing search results
 */
import { log, LOG_CATEGORIES } from "logger";

import { getEnv } from "packages/config/env";
import type {
  PropertySearchResult,
  SearchByPolygonResponse,
} from "packages/schemas/api";
import type { SearchResult } from "packages/schemas/search/search";

/**
 * Transform PropertySearchResult from API to SearchResult format
 */
export function transformPropertySearchResult(
  property: PropertySearchResult,
  index: number,
  fallbackCenter?: { lat: number; lng: number },
): SearchResult {
  const score = property._score ?? 0;

  const isDev = getEnv().isDevelopment;
  if (index < 5) {
    // Log only the first few properties per response to avoid log spam
    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "🗺️ [SEARCH TRANSFORM] Property coordinates before/after transform",
      {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        index,
        id: property.zpid,
        address: property.address,
        rawLatitude: property.latitude,
        rawLongitude: property.longitude,
        fallbackCenter,
      },
    );
  }

  return {
    id: property.zpid ?? `${Date.now()}-${index}`,
    address: property.address ?? "Address not available",
    price: property.price
      ? property.price.toLocaleString()
      : "Price not available",
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    sqft:
      typeof property.livingArea === "number"
        ? property.livingArea
        : typeof property.livingArea === "string"
          ? parseInt((property.livingArea as string).replace(/,/g, "")) || 0
          : 0,
    lat:
      property.latitude ??
      fallbackCenter?.lat ??
      0 + (Math.random() - 0.5) * 0.01,
    lng:
      property.longitude ??
      fallbackCenter?.lng ??
      0 + (Math.random() - 0.5) * 0.01,
    lotSize:
      property.lotAreaValue && property.lotAreaUnit
        ? `${property.lotAreaValue.toLocaleString()} ${property.lotAreaUnit}`
        : undefined,
    propertyType: property.propertyType ?? "Single Family",
    listingStatus: property.listingStatus ?? "For Sale",
    imageUrl: property.imgSrc ?? "/default-home.jpg",
    _score: score,
    zpid: property.zpid ? parseInt(property.zpid) : undefined,
  };
}

/**
 * Transform SearchByPolygonResponse to SearchResult array
 */
export function transformSearchResponse(
  response: SearchByPolygonResponse,
  fallbackCenter?: { lat: number; lng: number },
): SearchResult[] {
  if (!response.success || !response.properties) {
    log.warn(LOG_CATEGORIES.SEARCH, "Search response has no properties", {
      success: response.success,
      error: response.error,
    });
    return [];
  }

  return response.properties.map((property, index) =>
    transformPropertySearchResult(property, index, fallbackCenter),
  );
}
