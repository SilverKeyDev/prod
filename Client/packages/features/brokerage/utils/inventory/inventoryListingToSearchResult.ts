import type { InventoryListing } from "packages/features/brokerage/utils/inventory/inventoryFixtures";
import { inventoryStatusToPinScore } from "packages/features/brokerage/utils/inventory/inventoryStatusPinScore";
import type { SearchResult } from "packages/features/search/types";
import { getPlaceholderImage } from "packages/utils/product/media/placeholderAssets";

const STATUS_TO_LISTING: Record<InventoryListing["status"], string> = {
  active: "FOR_SALE",
  pending: "PENDING",
  sold: "SOLD",
};

/** Fixture inventory has no media/size data — cards use these shared placeholders. */
export const INVENTORY_PLACEHOLDER_SQFT = 1850;
export const INVENTORY_PLACEHOLDER_LOT_SIZE = "0.25 acres";

/**
 * Adapt brokerage inventory fixture listings into SearchResult for shared
 * SearchResultListingCard / useMapMarkers / MapPropertyCard chrome.
 */
export function inventoryListingToSearchResult(
  listing: InventoryListing,
  imageIndex = 0
): SearchResult {
  const fillerImage = getPlaceholderImage(imageIndex);
  return {
    id: listing.id,
    address: listing.address,
    price: listing.price != null ? String(listing.price) : "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: INVENTORY_PLACEHOLDER_SQFT,
    lotSize: INVENTORY_PLACEHOLDER_LOT_SIZE,
    lat: listing.lat,
    lng: listing.lng,
    imageUrl: fillerImage,
    images: [fillerImage],
    propertyType: listing.property_type ?? undefined,
    listingStatus: STATUS_TO_LISTING[listing.status],
    _score: inventoryStatusToPinScore(listing.status),
  };
}

export function inventoryListingsToSearchResults(listings: InventoryListing[]): SearchResult[] {
  return listings.map((listing, index) => inventoryListingToSearchResult(listing, index));
}
