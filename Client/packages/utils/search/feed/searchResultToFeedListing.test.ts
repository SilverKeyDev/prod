import { describe, expect, it } from "vitest";

import type { SearchResult } from "packages/types";
import { DEFAULT_PLACEHOLDER_IMAGE } from "packages/utils/media/placeholderAssets";

import { searchResultToFeedListing } from "./searchResultToFeedListing";

const base: SearchResult = {
  id: "p1",
  address: "123 Main St",
  price: "450000",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  lat: 30.1,
  lng: -97.7,
};

describe("searchResultToFeedListing", () => {
  it("merges imageUrl and images with dedupe", () => {
    const listing = searchResultToFeedListing({
      ...base,
      imageUrl: "https://a.example/1.jpg",
      images: ["https://a.example/1.jpg", "https://b.example/2.jpg"],
    });
    expect(listing.images).toEqual(["https://a.example/1.jpg", "https://b.example/2.jpg"]);
    expect(listing.thumbnailUrl).toBe("https://a.example/1.jpg");
  });

  it("uses placeholder when no images", () => {
    const listing = searchResultToFeedListing({
      ...base,
      imageUrl: undefined,
      images: undefined,
    });
    expect(listing.images).toEqual([DEFAULT_PLACEHOLDER_IMAGE]);
    expect(listing.thumbnailUrl).toBe(DEFAULT_PLACEHOLDER_IMAGE);
  });

  it("parses string price to number", () => {
    const listing = searchResultToFeedListing({ ...base, price: "$1,250,000" });
    expect(listing.price).toBe(1250000);
  });

  it("omits invalid price", () => {
    const listing = searchResultToFeedListing({ ...base, price: "n/a" });
    expect(listing.price).toBeUndefined();
  });

  it("sets imagesFirst and location fields", () => {
    const listing = searchResultToFeedListing({
      ...base,
      city: "Austin",
      state: "TX",
      zipcode: "78701",
      imageUrl: "https://x/img.jpg",
    });
    expect(listing.mediaOrder).toBe("imagesFirst");
    expect(listing.city).toBe("Austin");
    expect(listing.state).toBe("TX");
    expect(listing.zipCode).toBe("78701");
    expect(listing.features).toContain("3 bed");
    expect(listing.features).toContain("2 bath");
    expect(listing.features?.some((f) => f.includes("sqft"))).toBe(true);
  });

  it("uses Property as user name when address empty", () => {
    const listing = searchResultToFeedListing({ ...base, address: "   " });
    expect(listing.user.name).toBe("Property");
  });
});
