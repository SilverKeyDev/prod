import { describe, expect, it } from "vitest";

import type { InventoryListing } from "packages/features/brokerage/utils/inventory/inventoryFixtures";
import { getPlaceholderImage } from "packages/utils/product/media/placeholderAssets";

import {
  INVENTORY_PLACEHOLDER_LOT_SIZE,
  INVENTORY_PLACEHOLDER_SQFT,
  inventoryListingsToSearchResults,
  inventoryListingToSearchResult,
} from "./inventoryListingToSearchResult";

const sample: InventoryListing = {
  id: "inv-1",
  external_id: "demo-1",
  address: "120 Peachtree St NE, Atlanta, GA",
  status: "active",
  price: 425000,
  lat: 33.759,
  lng: -84.388,
  agent_name: "Dean Houston",
  property_type: "Single Family",
};

describe("inventoryListingToSearchResult", () => {
  it("maps inventory fields onto SearchResult for shared cards/markers", () => {
    const result = inventoryListingToSearchResult(sample);
    expect(result.id).toBe("inv-1");
    expect(result.address).toContain("Peachtree");
    expect(result.price).toBe("425000");
    expect(result.listingStatus).toBe("FOR_SALE");
    expect(result.propertyType).toBe("Single Family");
    expect(result._score).toBe(90);
    expect(result.lat).toBe(33.759);
    expect(result.lng).toBe(-84.388);
    expect(result.imageUrl).toBe(getPlaceholderImage(0));
    expect(result.images).toEqual([getPlaceholderImage(0)]);
    expect(result.sqft).toBe(INVENTORY_PLACEHOLDER_SQFT);
    expect(result.lotSize).toBe(INVENTORY_PLACEHOLDER_LOT_SIZE);
  });

  it("assigns a distinct filler image per listing index", () => {
    const results = inventoryListingsToSearchResults([
      sample,
      { ...sample, id: "inv-2", address: "88 Midtown Ave" },
      { ...sample, id: "inv-3", address: "450 Buckhead Pl" },
    ]);
    expect(results[0].imageUrl).toBe(getPlaceholderImage(0));
    expect(results[1].imageUrl).toBe(getPlaceholderImage(1));
    expect(results[2].imageUrl).toBe(getPlaceholderImage(2));
    expect(new Set(results.map((r) => r.imageUrl)).size).toBe(3);
  });

  it("maps pending and sold statuses and null price", () => {
    expect(
      inventoryListingToSearchResult({ ...sample, status: "pending", price: null }).listingStatus
    ).toBe("PENDING");
    expect(inventoryListingToSearchResult({ ...sample, status: "pending" })._score).toBe(60);
    expect(inventoryListingToSearchResult({ ...sample, status: "sold" }).listingStatus).toBe(
      "SOLD"
    );
    expect(inventoryListingToSearchResult({ ...sample, status: "sold" })._score).toBe(30);
    expect(inventoryListingToSearchResult({ ...sample, price: null }).price).toBe("");
  });
});
