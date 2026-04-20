import { describe, expect, it } from "vitest";

import type { SearchResult } from "packages/features/search/types";

import { sortSearchResults } from "./sortSearchResults";

const base = (over: Partial<SearchResult>): SearchResult => ({
  id: over.id ?? "x",
  address: over.address ?? "a",
  price: over.price ?? "100",
  bedrooms: over.bedrooms ?? 2,
  bathrooms: over.bathrooms ?? 2,
  sqft: over.sqft ?? 1000,
  lat: over.lat ?? 0,
  lng: over.lng ?? 0,
  ...over,
});

describe("sortSearchResults", () => {
  it("sorts by match_score descending", () => {
    const a = base({ id: "a", _score: 10 });
    const b = base({ id: "b", _score: 90 });
    const out = sortSearchResults([a, b], "match_score", {
      userGeolocation: null,
      searchBarAnchor: null,
      importantLocations: [],
    });
    expect(out.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("sorts by price ascending", () => {
    const hi = base({ id: "hi", price: "900,000" });
    const lo = base({ id: "lo", price: "100,000" });
    const out = sortSearchResults([hi, lo], "price", {
      userGeolocation: null,
      searchBarAnchor: null,
      importantLocations: [],
    });
    expect(out.map((p) => p.id)).toEqual(["lo", "hi"]);
  });

  it("sorts by price descending when direction is desc", () => {
    const hi = base({ id: "hi", price: "900,000" });
    const lo = base({ id: "lo", price: "100,000" });
    const out = sortSearchResults(
      [hi, lo],
      "price",
      {
        userGeolocation: null,
        searchBarAnchor: null,
        importantLocations: [],
      },
      { sortDirection: "desc" }
    );
    expect(out.map((p) => p.id)).toEqual(["hi", "lo"]);
  });

  it("falls back to match score when distance mode is none", () => {
    const a = base({ id: "a", _score: 50, lat: 0, lng: 0 });
    const b = base({ id: "b", _score: 80, lat: 1, lng: 1 });
    const out = sortSearchResults([a, b], "distance", {
      userGeolocation: null,
      searchBarAnchor: null,
      importantLocations: [],
    });
    expect(out.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("sorts by distance from point anchor", () => {
    const anchor = { lat: 0, lng: 0 };
    const near = base({ id: "n", lat: 0.01, lng: 0.01, _score: 0 });
    const far = base({ id: "f", lat: 10, lng: 10, _score: 100 });
    const out = sortSearchResults([far, near], "distance", {
      userGeolocation: anchor,
      searchBarAnchor: null,
      importantLocations: [],
    });
    expect(out.map((p) => p.id)).toEqual(["n", "f"]);
  });
});
