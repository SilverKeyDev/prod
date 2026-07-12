import { describe, expect, it } from "vitest";

import { buildBrokerageInventory } from "./inventoryTransforms";

describe("buildBrokerageInventory", () => {
  it("returns a subsample for week vs full set for month", () => {
    const week = buildBrokerageInventory("week");
    const month = buildBrokerageInventory("month");
    expect(week.length).toBeGreaterThan(0);
    expect(week.length).toBeLessThanOrEqual(month.length);
    expect(month.length).toBe(96);
  });

  it("scales listing count up for longer periods and caps map density", () => {
    const month = buildBrokerageInventory("month");
    const year = buildBrokerageInventory("year");
    const all = buildBrokerageInventory("all");
    expect(year.length).toBeGreaterThan(month.length);
    expect(all.length).toBeGreaterThanOrEqual(year.length);
    expect(all.length).toBeLessThanOrEqual(360);
    expect(new Set(year.map((l) => l.id)).size).toBe(year.length);
  });

  it("keeps month pins inside Atlanta metro bounds", () => {
    const month = buildBrokerageInventory("month");
    for (const listing of month) {
      expect(listing.lat).toBeGreaterThan(33.4);
      expect(listing.lat).toBeLessThan(34.1);
      expect(listing.lng).toBeGreaterThan(-84.8);
      expect(listing.lng).toBeLessThan(-84.0);
    }
  });
});
