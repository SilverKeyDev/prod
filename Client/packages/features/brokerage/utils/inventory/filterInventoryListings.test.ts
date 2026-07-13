import { describe, expect, it } from "vitest";

import type {
  InventoryClientFilters,
  InventoryListing,
} from "packages/features/brokerage/types/inventory";

import { filterInventoryListings, uniquePropertyTypes } from "./filterInventoryListings";

const baseFilters: InventoryClientFilters = {
  status: "all",
  priceTier: "all",
  priceMin: null,
  priceMax: null,
  propertyType: null,
  agentQuery: "",
};

const listings: InventoryListing[] = [
  {
    id: "1",
    external_id: "1",
    address: "A",
    status: "active",
    price: 400_000,
    lat: 0,
    lng: 0,
    agent_name: "Dean Houston",
    property_type: "Single Family",
  },
  {
    id: "2",
    external_id: "2",
    address: "B",
    status: "sold",
    price: 800_000,
    lat: 0,
    lng: 0,
    agent_name: "Joe Taylor",
    property_type: "Condo",
  },
  {
    id: "3",
    external_id: "3",
    address: "C",
    status: "pending",
    price: null,
    lat: 0,
    lng: 0,
    agent_name: null,
    property_type: "Single Family",
  },
];

describe("filterInventoryListings", () => {
  it("filters by status, price, property type, and agent", () => {
    expect(filterInventoryListings(listings, { ...baseFilters, status: "active" })).toHaveLength(1);

    expect(
      filterInventoryListings(listings, { ...baseFilters, priceMin: 500_000 }).map((l) => l.id)
    ).toEqual(["2"]);

    expect(
      filterInventoryListings(listings, { ...baseFilters, propertyType: "Condo" }).map((l) => l.id)
    ).toEqual(["2"]);

    expect(
      filterInventoryListings(listings, { ...baseFilters, agentQuery: "dean" }).map((l) => l.id)
    ).toEqual(["1"]);
  });

  it("filters by neighborhood price tier", () => {
    expect(
      filterInventoryListings(listings, { ...baseFilters, priceTier: "middle" }).map((l) => l.id)
    ).toEqual(["1"]);
    expect(
      filterInventoryListings(listings, { ...baseFilters, priceTier: "upper" }).map((l) => l.id)
    ).toEqual(["2"]);
  });

  it("excludes null-price listings when a price bound is set", () => {
    expect(
      filterInventoryListings(listings, {
        ...baseFilters,
        priceMin: 100_000,
        priceMax: 900_000,
      }).map((l) => l.id)
    ).toEqual(["1", "2"]);
  });

  it("lists unique property types", () => {
    expect(uniquePropertyTypes(listings)).toEqual(["Condo", "Single Family"]);
  });
});
