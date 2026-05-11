/**
 * Search transform utilities: map API results to SearchResult format.
 */
import { getEnv } from "packages/config/env";
import { log, LOG_CATEGORIES } from "packages/logger";
import type { PropertySearchResult, SearchByPolygonResponse } from "packages/types/domain/api";
import { formatPropertySearchListingPrice } from "packages/utils/search/pricing/formatPropertySearchListingPrice";

import type { SearchResult } from "@/features/search/types";

/** Pre–OpenAPI-alignment polygon row (flat). */
type LegacyFlatPolygonProperty = {
  zpid?: string;
  mls_home_id?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number | string;
  lotAreaValue?: number;
  lotAreaUnit?: string;
  propertyType?: string;
  listingStatus?: string;
  imgSrc?: string;
  _score?: number;
  score?: number;
};

function isOpenApiPropertySearchResult(p: unknown): p is PropertySearchResult {
  return (
    typeof p === "object" &&
    p !== null &&
    "essentials" in p &&
    "location" in p &&
    typeof (p as PropertySearchResult).id === "string"
  );
}

function transformLegacyFlatPolygonProperty(
  property: LegacyFlatPolygonProperty,
  index: number,
  fallbackCenter?: { lat: number; lng: number }
): SearchResult {
  const score = property._score ?? property.score ?? 0;
  const id = property.zpid ?? property.mls_home_id ?? `${Date.now()}-${index}`;
  const lat = property.latitude ?? fallbackCenter?.lat ?? 0;
  const lng = property.longitude ?? fallbackCenter?.lng ?? 0;
  return {
    id,
    address: property.address ?? "Address not available",
    price: formatPropertySearchListingPrice(property),
    bedrooms: property.bedrooms ?? 0,
    bathrooms: property.bathrooms ?? 0,
    sqft:
      typeof property.livingArea === "number"
        ? property.livingArea
        : typeof property.livingArea === "string"
          ? parseInt(property.livingArea.replace(/,/g, "")) || 0
          : 0,
    lat,
    lng,
    lotSize:
      property.lotAreaValue != null && property.lotAreaUnit
        ? `${property.lotAreaValue.toLocaleString()} ${property.lotAreaUnit}`
        : undefined,
    propertyType: property.propertyType ?? "Single Family",
    listingStatus: property.listingStatus ?? "For Sale",
    imageUrl: property.imgSrc ?? "/default-home.jpg",
    _score: score,
    zpid: property.zpid ? parseInt(property.zpid, 10) : undefined,
  };
}

/**
 * Transform PropertySearchResult from API to SearchResult format
 */
export function transformPropertySearchResult(
  property: PropertySearchResult | LegacyFlatPolygonProperty,
  index: number,
  fallbackCenter?: { lat: number; lng: number }
): SearchResult {
  if (isOpenApiPropertySearchResult(property)) {
    const score = property.score ?? 0;
    const isDev = getEnv().isDevelopment;
    if (index < 5) {
      log.debug(
        LOG_CATEGORIES.MAP_RENDERING,
        "[SEARCH TRANSFORM] Property coordinates (OpenAPI nested)",
        {
          environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
          index,
          id: property.id,
          address: property.location.address,
          rawLatitude: property.location.latitude,
          rawLongitude: property.location.longitude,
          fallbackCenter,
        }
      );
    }

    const lat = property.location.latitude ?? fallbackCenter?.lat ?? 0;
    const lng = property.location.longitude ?? fallbackCenter?.lng ?? 0;
    const zpidNum = /^\d+$/.test(property.id) ? parseInt(property.id, 10) : undefined;

    return {
      id: property.id || `${Date.now()}-${index}`,
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

  const isDev = getEnv().isDevelopment;
  if (index < 5) {
    log.debug(
      LOG_CATEGORIES.MAP_RENDERING,
      "[SEARCH TRANSFORM] Property coordinates (legacy flat row)",
      {
        environment: isDev ? "DEVELOPMENT" : "PRODUCTION",
        index,
        id: (property as LegacyFlatPolygonProperty).zpid,
        address: (property as LegacyFlatPolygonProperty).address,
        rawLatitude: (property as LegacyFlatPolygonProperty).latitude,
        rawLongitude: (property as LegacyFlatPolygonProperty).longitude,
        fallbackCenter,
      }
    );
  }

  return transformLegacyFlatPolygonProperty(
    property as LegacyFlatPolygonProperty,
    index,
    fallbackCenter
  );
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
      metaCached: (response as SearchByPolygonResponse & { meta?: { cached?: boolean } }).meta
        ?.cached,
    }
  );
  return mapped;
}
