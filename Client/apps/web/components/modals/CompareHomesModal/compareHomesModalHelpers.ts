/**
 * Helpers for CompareHomesModal; extracted to satisfy max-lines-per-function.
 */
import type { SavedHome } from "packages/schemas";
import type { CompareHomesPropertyDetails } from "packages/utils/domain/compareHomes/types";

/** Build property data for fetchPropertyDetails from a SavedHome. */
export function buildPropertyDataForUnlock(home: SavedHome): {
  id: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lat: number;
  lng: number;
  latitude: number;
  longitude: number;
  images: string[] | undefined;
} {
  return {
    id: home.home_id,
    address: String(home.address || home.description || ""),
    price:
      typeof home.price === "string"
        ? home.price.startsWith("$")
          ? home.price
          : `$${home.price}`
        : typeof home.price === "number"
          ? `$${home.price.toLocaleString()}`
          : "Price not available",
    bedrooms: home.bedrooms ?? 0,
    bathrooms: home.bathrooms ?? 0,
    sqft: home.sqft ?? 0,
    lat: home.lat ?? 0,
    lng: home.lng ?? 0,
    latitude: home.lat ?? 0,
    longitude: home.lng ?? 0,
    images: home.image_url ? [home.image_url] : undefined,
  };
}

type HomeWithExtras = SavedHome & {
  lot_size?: string;
  property_type?: string;
  propertyType?: string;
  listing_status?: string;
  listingStatus?: string;
};

/** Fallback comparison row when details are not yet loaded. */
export function fallbackComparisonDetails(
  home: SavedHome,
): CompareHomesPropertyDetails {
  const homeWithExtras = home as HomeWithExtras;
  return {
    id: home.home_id,
    address:
      typeof home.address === "string" || typeof home.address === "number"
        ? home.address.toString()
        : (home.description ?? "Unknown"),
    price:
      typeof home.price === "string"
        ? home.price
        : typeof home.price === "number"
          ? `$${home.price.toLocaleString()}`
          : "N/A",
    bedrooms: home.bedrooms ?? "—",
    bathrooms: home.bathrooms ?? "—",
    sqft: home.sqft && home.sqft > 0 ? home.sqft.toLocaleString() : "—",
    lotSize:
      typeof homeWithExtras.lot_size === "string"
        ? homeWithExtras.lot_size
        : "—",
    propertyType:
      typeof homeWithExtras.property_type === "string"
        ? homeWithExtras.property_type
        : typeof homeWithExtras.propertyType === "string"
          ? homeWithExtras.propertyType
          : "—",
    listingStatus:
      typeof homeWithExtras.listing_status === "string"
        ? homeWithExtras.listing_status
        : typeof homeWithExtras.listingStatus === "string"
          ? homeWithExtras.listingStatus
          : "—",
    imageUrl: home.image_url,
    isLoading: true,
  } as CompareHomesPropertyDetails;
}
