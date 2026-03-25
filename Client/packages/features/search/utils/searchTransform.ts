/**
 * Search transform utilities: map API results to SearchResult format.
 */
import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { PropertySearchResult, SearchByPolygonResponse } from "packages/types/api";

import type { SearchResult } from "@/features/search/types";

/**
 * Transform PropertySearchResult from API to SearchResult format
 */
export function transformPropertySearchResult(
  property: PropertySearchResult,
  index: number,
  fallbackCenter?: { lat: number; lng: number }
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
      }
    );
  }

  return {
    id: property.zpid ?? `${Date.now()}-${index}`,
    address: property.address ?? "Address not available",
    price: property.price ? property.price.toLocaleString() : "Price not available",
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    sqft:
      typeof property.livingArea === "number"
        ? property.livingArea
        : typeof property.livingArea === "string"
          ? parseInt((property.livingArea as string).replace(/,/g, "")) || 0
          : 0,
    lat: property.latitude ?? fallbackCenter?.lat ?? 0 + (Math.random() - 0.5) * 0.01,
    lng: property.longitude ?? fallbackCenter?.lng ?? 0 + (Math.random() - 0.5) * 0.01,
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
  fallbackCenter?: { lat: number; lng: number }
): SearchResult[] {
  if (!response.success || !response.properties) {
    log.warn(LOG_CATEGORIES.SEARCH, "Search response has no properties", {
      success: response.success,
      error: response.error,
    });
    return [];
  }

  const mapped = response.properties.map((property, index) =>
    transformPropertySearchResult(property, index, fallbackCenter)
  );
  log.info(
    LOG_CATEGORIES.SEARCH,
    "transformSearchResponse: mapped API properties to SearchResult",
    {
      inputCount: response.properties.length,
      outputCount: mapped.length,
      metaCached: response.meta?.cached,
    }
  );
  // #region agent log
  // eslint-disable-next-line no-restricted-globals -- Cursor debug NDJSON ingest (session 8adfea)
  fetch("http://127.0.0.1:7449/ingest/62a2c70d-285c-439c-8ad0-211f81794197", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8adfea",
    },
    body: JSON.stringify({
      sessionId: "8adfea",
      location: "searchTransform.ts:transformSearchResponse",
      message: "transform complete",
      data: {
        inputCount: response.properties.length,
        outputCount: mapped.length,
      },
      timestamp: Date.now(),
      hypothesisId: "E",
    }),
  }).catch(() => {});
  // #endregion
  return mapped;
}
