import { describe, expect, it } from "vitest";

import type { InventoryListing } from "packages/features/brokerage/types/inventory";
import { getMapPinColorsForScoreAndStatus } from "packages/utils";

import { getInventoryHouseImage } from "./inventoryHouseImages";
import {
  INVENTORY_PLACEHOLDER_LOT_SIZE,
  INVENTORY_PLACEHOLDER_SQFT,
  inventoryListingsToSearchResults,
  inventoryListingToSearchResult,
} from "./inventoryListingToSearchResult";
import { inventoryStatusToPinScore } from "./inventoryStatusPinScore";

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
  it("maps inventory fields onto SearchResult for shared markers", () => {
    const result = inventoryListingToSearchResult(sample);
    expect(result.id).toBe("inv-1");
    expect(result.address).toContain("Peachtree");
    expect(result.price).toBe("425000");
    expect(result.listingStatus).toBe("FOR_SALE");
    expect(result.propertyType).toBe("Single Family");
    expect(result._score).toBe(90);
    expect(result.lat).toBe(33.759);
    expect(result.lng).toBe(-84.388);
    expect(result.imageUrl).toBe(getInventoryHouseImage(0));
    expect(result.images).toEqual([getInventoryHouseImage(0)]);
    expect(result.sqft).toBe(INVENTORY_PLACEHOLDER_SQFT);
    expect(result.lotSize).toBe(INVENTORY_PLACEHOLDER_LOT_SIZE);
  });

  it("colors pins by price tier when colorMode is price_tier", () => {
    expect(inventoryListingToSearchResult(sample, 0, "price_tier")._score).toBe(60);
    expect(
      inventoryListingToSearchResult({ ...sample, price: 1_200_000 }, 0, "price_tier")._score
    ).toBe(90);
  });

  it("maps status scores onto distinct search map pin colors", () => {
    const active = inventoryListingToSearchResult(sample, 0, "status");
    const pending = inventoryListingToSearchResult({ ...sample, status: "pending" }, 0, "status");
    const sold = inventoryListingToSearchResult({ ...sample, status: "sold" }, 0, "status");

    expect(active._score).toBe(inventoryStatusToPinScore("active"));
    expect(pending._score).toBe(inventoryStatusToPinScore("pending"));
    expect(sold._score).toBe(inventoryStatusToPinScore("sold"));

    const activeColors = getMapPinColorsForScoreAndStatus(active._score ?? 0);
    const pendingColors = getMapPinColorsForScoreAndStatus(pending._score ?? 0);
    const soldColors = getMapPinColorsForScoreAndStatus(sold._score ?? 0);
    expect(activeColors.fillColor).not.toBe(pendingColors.fillColor);
    expect(pendingColors.fillColor).not.toBe(soldColors.fillColor);
    expect(activeColors.fillColor).not.toBe(soldColors.fillColor);
  });

  it("assigns a distinct house photo per listing index", () => {
    const results = inventoryListingsToSearchResults([
      sample,
      { ...sample, id: "inv-2", address: "88 Midtown Ave" },
      { ...sample, id: "inv-3", address: "450 Buckhead Pl" },
    ]);
    expect(results[0].imageUrl).toBe(getInventoryHouseImage(0));
    expect(results[1].imageUrl).toBe(getInventoryHouseImage(1));
    expect(results[2].imageUrl).toBe(getInventoryHouseImage(2));
    expect(new Set(results.map((r) => r.imageUrl)).size).toBe(3);
    for (const r of results) {
      expect(r.imageUrl).toMatch(/^https:\/\/images\.unsplash\.com\//);
    }
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
