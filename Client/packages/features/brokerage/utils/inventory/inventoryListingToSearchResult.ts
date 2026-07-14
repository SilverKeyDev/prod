import type {
  InventoryColorMode,
  InventoryListing,
} from "packages/features/brokerage/types/inventory";
import { getInventoryHouseImage } from "packages/features/brokerage/utils/inventory/inventoryHouseImages";
import { inventoryListingPinScore } from "packages/features/brokerage/utils/inventory/inventoryPriceTier";
import type { SearchResult } from "packages/features/search/types";

const STATUS_TO_LISTING: Record<InventoryListing["status"], string> = {
  active: "FOR_SALE",
  pending: "PENDING",
  sold: "SOLD",
};

/** Fixture inventory has no size data — placeholders kept for SearchResult shape. */
export const INVENTORY_PLACEHOLDER_SQFT = 1850;
export const INVENTORY_PLACEHOLDER_LOT_SIZE = "0.25 acres";

/**
 * Adapt brokerage inventory listings into SearchResult for useMapMarkers pins.
 */
export function inventoryListingToSearchResult(
  listing: InventoryListing,
  imageIndex = 0,
  colorMode: InventoryColorMode = "status"
): SearchResult {
  const houseImage = getInventoryHouseImage(imageIndex);
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
    imageUrl: houseImage,
    images: [houseImage],
    propertyType: listing.property_type ?? undefined,
    listingStatus: STATUS_TO_LISTING[listing.status],
    _score: inventoryListingPinScore(listing, colorMode),
  };
}

export function inventoryListingsToSearchResults(
  listings: InventoryListing[],
  colorMode: InventoryColorMode = "status"
): SearchResult[] {
  return listings.map((listing, index) =>
    inventoryListingToSearchResult(listing, index, colorMode)
  );
}
