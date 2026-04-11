import { describe, expect, it } from "vitest";

import type { HomeDescription } from "packages/ui/components/cards/HomeCard";
import { homeDescriptionToSearchResult } from "packages/utils/search/homeDescriptionToSearchResult";

describe("homeDescriptionToSearchResult", () => {
  it("maps snapshot fields to SearchResult", () => {
    const home: HomeDescription = {
      home_id: "z-123",
      address: "1 Main St",
      price: 500_000,
      bedrooms: 2,
      bathrooms: 1,
      sqft: 1200,
      image_url: "https://example.com/i.jpg",
      lat: 40,
      lng: -74,
      calculatedScore: 85,
    };
    const r = homeDescriptionToSearchResult(home);
    expect(r.id).toBe("z-123");
    expect(r.address).toBe("1 Main St");
    expect(r._score).toBe(85);
    expect(r.imageUrl).toBe("https://example.com/i.jpg");
    expect(r.lat).toBe(40);
    expect(r.lng).toBe(-74);
    expect(r.bedrooms).toBe(2);
    expect(r.sqft).toBe(1200);
  });

  it("omits score when out of range", () => {
    const home: HomeDescription = { home_id: "z-1", calculatedScore: 0 };
    expect(homeDescriptionToSearchResult(home)._score).toBeUndefined();
  });
});
