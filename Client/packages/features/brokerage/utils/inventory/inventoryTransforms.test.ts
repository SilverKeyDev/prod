import { describe, expect, it } from "vitest";

import { buildBrokerageInventory } from "./inventoryTransforms";

describe("buildBrokerageInventory", () => {
  it("returns a subsample for week vs full set for month", () => {
    const week = buildBrokerageInventory("week");
    const month = buildBrokerageInventory("month");
    expect(week.length).toBeGreaterThan(0);
    expect(week.length).toBeLessThanOrEqual(month.length);
    expect(month.length).toBe(8);
  });

  it("scales listing count up for longer periods", () => {
    const month = buildBrokerageInventory("month");
    const year = buildBrokerageInventory("year");
    const all = buildBrokerageInventory("all");
    expect(year.length).toBeGreaterThan(month.length);
    expect(all.length).toBeGreaterThanOrEqual(year.length);
    expect(new Set(year.map((l) => l.id)).size).toBe(year.length);
  });
});
