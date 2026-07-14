import { describe, expect, it } from "vitest";

import type { InventoryListing } from "packages/features/brokerage/types/inventory";

import { computeMarketInventoryMetrics } from "./marketInventoryMetrics";

const listings: InventoryListing[] = [
  {
    id: "1",
    external_id: "1",
    address: "A",
    status: "active",
    price: 200_000,
    lat: 0,
    lng: 0,
    agent_name: null,
    property_type: "Condo",
  },
  {
    id: "2",
    external_id: "2",
    address: "B",
    status: "active",
    price: 400_000,
    lat: 0,
    lng: 0,
    agent_name: null,
    property_type: "Single Family",
  },
  {
    id: "3",
    external_id: "3",
    address: "C",
    status: "pending",
    price: 700_000,
    lat: 0,
    lng: 0,
    agent_name: null,
    property_type: "Single Family",
  },
  {
    id: "4",
    external_id: "4",
    address: "D",
    status: "sold",
    price: 1_000_000,
    lat: 0,
    lng: 0,
    agent_name: null,
    property_type: "Single Family",
  },
];

describe("computeMarketInventoryMetrics", () => {
  it("computes averages, status counts, tiers, and property mix", () => {
    const m = computeMarketInventoryMetrics(listings);
    expect(m.total_count).toBe(4);
    expect(m.active_count).toBe(2);
    expect(m.pending_count).toBe(1);
    expect(m.sold_count).toBe(1);
    expect(m.average_price).toBe(575_000);
    expect(m.median_price).toBe(550_000);
    expect(m.min_price).toBe(200_000);
    expect(m.max_price).toBe(1_000_000);

    const byTier = Object.fromEntries(m.tier_breakdown.map((t) => [t.tier, t.count]));
    expect(byTier).toEqual({ lower: 1, middle: 1, upper: 1, wealthy: 1 });

    expect(m.property_type_mix[0]).toMatchObject({ type: "Single Family", count: 3 });
    expect(m.property_type_mix[1]).toMatchObject({ type: "Condo", count: 1 });
  });

  it("handles empty listings", () => {
    const m = computeMarketInventoryMetrics([]);
    expect(m.total_count).toBe(0);
    expect(m.average_price).toBeNull();
    expect(m.median_price).toBeNull();
  });
});
