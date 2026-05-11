import { describe, expect, it } from "vitest";

import type { SearchResult } from "packages/features/search/types/result";

import { searchResultsToSavedHomesForShare } from "./searchResultsToSavedHomesForShare";

const baseResult = (): SearchResult => ({
  id: "zpid-1",
  address: "123 Main St",
  price: "$500,000",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
  lat: 40,
  lng: -74,
  lotSize: "0.25 ac",
  imageUrl: "https://example.com/a.jpg",
});

describe("searchResultsToSavedHomesForShare", () => {
  it("maps SearchResult fields to SavedHome shape for attachment builder", () => {
    const rows = searchResultsToSavedHomesForShare([baseResult()]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      home_id: "zpid-1",
      address: "123 Main St",
      description: "123 Main St",
      price: "$500,000",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1500,
      lot_size: "0.25 ac",
      image_url: "https://example.com/a.jpg",
      lat: 40,
      lng: -74,
    });
  });

  it("dedupes and builds bundle when two distinct homes are mapped", () => {
    const a = baseResult();
    const b: SearchResult = {
      ...baseResult(),
      id: "zpid-2",
      address: "456 Oak",
      imageUrl: undefined,
    };
    const rows = searchResultsToSavedHomesForShare([a, b]);
    expect(rows.map((home) => home.home_id)).toEqual(["zpid-1", "zpid-2"]);
  });
});
