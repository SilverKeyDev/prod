import { describe, expect, it } from "vitest";

import { mapToAddFavoriteHomePayload } from "./mapToAddFavoriteHomePayload";

describe("mapToAddFavoriteHomePayload", () => {
  it("maps a rich property object to wire payload fields", () => {
    const result = mapToAddFavoriteHomePayload({
      id: "zpid-1",
      address: "123 Main St",
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      lat: 40.1,
      lng: -74.2,
      propertyType: "single_family",
      listingStatus: "for_sale",
      imageUrl: "https://example.com/a.jpg",
    });

    expect(result).toMatchObject({
      id: "zpid-1",
      address: "123 Main St",
      price: "450000",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      lat: 40.1,
      lng: -74.2,
      propertyType: "single_family",
      listingStatus: "for_sale",
      imageUrl: "https://example.com/a.jpg",
    });
  });

  it("accepts alternate field names and string price with grouping", () => {
    const result = mapToAddFavoriteHomePayload({
      home_id: "h2",
      description: "9 Oak Ave",
      price: "$1,250,000",
      beds: 4,
      baths: 3,
      livingArea: 2200,
      latitude: 41,
      longitude: -71,
      property_type: "condo",
      listing_status: "pending",
    });

    expect(result).toMatchObject({
      id: "h2",
      address: "9 Oak Ave",
      price: "1250000",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2200,
      lat: 41,
      lng: -71,
      propertyType: "condo",
      listingStatus: "pending",
    });
  });

  it("handles nullish input with safe defaults", () => {
    const result = mapToAddFavoriteHomePayload(null);
    expect(result).toMatchObject({
      id: "",
      address: "",
      price: "",
      bedrooms: 0,
      bathrooms: 0,
      sqft: 0,
      lat: 0,
      lng: 0,
      propertyType: "",
      listingStatus: "",
    });
  });
});
