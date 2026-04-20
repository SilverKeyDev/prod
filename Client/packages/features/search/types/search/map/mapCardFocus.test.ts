import { describe, expect, it } from "vitest";

import type { SearchResult } from "@/features/search/types";

import { getMapFocusedSlotAssignmentsExcludingDismissed } from "./mapCardFocus";

function mockResults(count: number): SearchResult[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    address: `${i} Main St`,
    price: "",
    bedrooms: 0,
    bathrooms: 0,
    sqft: 0,
    lat: 40 + i * 0.01,
    lng: -74 - i * 0.01,
    propertyType: "SINGLE_FAMILY",
    listingStatus: "FOR_SALE",
  }));
}

describe("getMapFocusedSlotAssignmentsExcludingDismissed", () => {
  it("does not backfill when the current slot is dismissed", () => {
    const results = mockResults(5);
    const dismissed = new Set<string>(["id-0"]);
    const got = getMapFocusedSlotAssignmentsExcludingDismissed(results, 0, 2, dismissed);
    expect(got.map((g) => g.property.id)).toEqual(["id-1"]);
    expect(got[0]?.slotIndex).toBe(1);
  });

  it("returns empty when every slot in the window is dismissed", () => {
    const results = mockResults(3);
    const dismissed = new Set<string>(["id-0", "id-1"]);
    const got = getMapFocusedSlotAssignmentsExcludingDismissed(results, 0, 2, dismissed);
    expect(got).toEqual([]);
  });

  it("returns empty when startPage is negative", () => {
    const results = mockResults(2);
    const got = getMapFocusedSlotAssignmentsExcludingDismissed(results, -1, 1, new Set());
    expect(got).toEqual([]);
  });
});
