import type { BrokerageInventoryListing } from "packages/features/brokerage/types/inventory";
import type { SearchResult } from "packages/features/search/types/domain/result";

/** Map brokerage demo inventory rows into SearchResult cards (search/saved card pipeline). */
export function inventoryListingToSearchResult(
  listing: BrokerageInventoryListing
): SearchResult {
  return {
    id: listing.id,
    address: listing.address,
    price: String(listing.price),
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    lat: listing.lat,
    lng: listing.lng,
    lotSize: listing.lotSize,
    propertyType: listing.propertyType,
    listingStatus: listing.listingStatus,
    imageUrl: listing.imageUrl,
  };
}

export function brokerageInventoryToSearchResults(
  listings: readonly BrokerageInventoryListing[]
): SearchResult[] {
  return listings.map(inventoryListingToSearchResult);
}
