import { describe, expect, it } from "vitest";

import { BROKERAGE_INVENTORY_FIXTURE } from "packages/features/brokerage/utils/inventory/brokerageInventoryFixtures";
import {
  brokerageInventoryToSearchResults,
  inventoryListingToSearchResult,
} from "packages/features/brokerage/utils/inventory/inventoryListingToSearchResult";
import { displayListingPriceForCard } from "packages/utils/product/search/pricing/formatPropertySearchListingPrice";

describe("inventoryListingToSearchResult", () => {
  it("maps fixture listing fields to SearchResult", () => {
    const listing = BROKERAGE_INVENTORY_FIXTURE[0];
    const result = inventoryListingToSearchResult(listing);

    expect(result).toMatchObject({
      id: listing.id,
      address: listing.address,
      price: "425000",
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      lat: listing.lat,
      lng: listing.lng,
      imageUrl: listing.imageUrl,
    });
  });

  it("formats mapped price for listing cards with locale separators", () => {
    const result = inventoryListingToSearchResult(BROKERAGE_INVENTORY_FIXTURE[0]);

    expect(displayListingPriceForCard(result.price)).toBe("$425,000");
  });

  it("maps all demo inventory rows", () => {
    const results = brokerageInventoryToSearchResults(BROKERAGE_INVENTORY_FIXTURE);

    expect(results).toHaveLength(BROKERAGE_INVENTORY_FIXTURE.length);
    expect(results.every((row) => typeof row.price === "string")).toBe(true);
  });
});
