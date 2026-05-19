import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PropertySearchResult } from "packages/types/domain/api";

import {
  transformPropertySearchResult,
  transformSearchResponse,
} from "./searchTransform";

vi.mock("packages/config/env", () => ({
  getEnv: () => ({ isDevelopment: false }),
}));

vi.mock("packages/logger", () => ({
  log: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  LOG_CATEGORIES: {
    SEARCH: "search",
    MAP_RENDERING: "map_rendering",
  },
}));

function openApiProperty(overrides: Partial<PropertySearchResult> = {}): PropertySearchResult {
  return {
    id: "12345678",
    essentials: {
      bedrooms: 3,
      bathrooms: 2,
      livingAreaSqft: 1800,
    },
    location: {
      address: "123 Main St",
      city: "Austin",
      state: "TX",
      zipcode: "78701",
      latitude: 30.27,
      longitude: -97.74,
    },
    financials: { price: 450000 },
    media: { primaryImageUrl: "https://example.com/img.jpg" },
    metadata: { listingStatus: "FOR_SALE", homeType: "Single Family" },
    score: 88,
    ...overrides,
  };
}

describe("transformPropertySearchResult", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps OpenAPI PropertySearchResult to SearchResult", () => {
    const result = transformPropertySearchResult(openApiProperty(), 0);

    expect(result).toMatchObject({
      id: "12345678",
      address: "123 Main St",
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      lat: 30.27,
      lng: -97.74,
      propertyType: "Single Family",
      listingStatus: "FOR_SALE",
      imageUrl: "https://example.com/img.jpg",
      _score: 88,
      zpid: 12345678,
    });
    expect(result.price).toBeTruthy();
  });

  it("uses fallback center when OpenAPI coordinates are missing", () => {
    const result = transformPropertySearchResult(
      openApiProperty({
        location: {
          address: "456 Oak Ave",
          city: "Austin",
          state: "TX",
          zipcode: "78702",
          latitude: null,
          longitude: null,
        },
      }),
      1,
      { lat: 30.5, lng: -97.5 }
    );

    expect(result.lat).toBe(30.5);
    expect(result.lng).toBe(-97.5);
  });

  it("maps legacy flat polygon row", () => {
    const result = transformPropertySearchResult(
      {
        zpid: "999",
        address: "789 Pine Rd",
        latitude: 30.1,
        longitude: -97.1,
        bedrooms: 4,
        bathrooms: 3,
        livingArea: "2,100",
        propertyType: "Townhouse",
        listingStatus: "For Sale",
        imgSrc: "/legacy.jpg",
        _score: 72,
      },
      0
    );

    expect(result).toMatchObject({
      id: "999",
      address: "789 Pine Rd",
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2100,
      lat: 30.1,
      lng: -97.1,
      propertyType: "Townhouse",
      listingStatus: "For Sale",
      imageUrl: "/legacy.jpg",
      _score: 72,
    });
  });

  it("defaults OpenAPI score to 0 when field is missing", () => {
    const result = transformPropertySearchResult(
      openApiProperty({ score: undefined }),
      0
    );
    expect(result._score).toBe(0);
  });

  it("preserves distinct fractional scores on OpenAPI rows", () => {
    const a = transformPropertySearchResult(openApiProperty({ score: 53.2, id: "1" }), 0);
    const b = transformPropertySearchResult(openApiProperty({ score: 54.8, id: "2" }), 1);
    expect(a._score).toBe(53.2);
    expect(b._score).toBe(54.8);
  });

  it("handles missing address and string livingArea on legacy rows", () => {
    const result = transformPropertySearchResult(
      {
        mls_home_id: "mls-1",
        livingArea: "not-a-number",
      },
      2,
      { lat: 1, lng: 2 }
    );

    expect(result.address).toBe("Address not available");
    expect(result.sqft).toBe(0);
    expect(result.lat).toBe(1);
    expect(result.lng).toBe(2);
  });
});

describe("transformSearchResponse", () => {
  it("returns empty array when response is unsuccessful", () => {
    expect(
      transformSearchResponse({ success: false, error: "failed" } as never, { lat: 0, lng: 0 })
    ).toEqual([]);
  });

  it("deduplicates properties by id", () => {
    const prop = openApiProperty();
    const results = transformSearchResponse(
      {
        success: true,
        properties: [prop, { ...prop }],
      } as never,
      { lat: 30, lng: -97 }
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe("12345678");
  });
});
