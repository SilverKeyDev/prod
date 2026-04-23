import { describe, expect, it } from "vitest";

import { countItineraryNavigationNodes, itineraryCanOpenNavigation } from "./viewingRoutePlan";

describe("itinerary navigation eligibility", () => {
  it("legacy two property stops with coords", () => {
    const it = {
      stops: [
        { address: "A", lat: 1, lng: 2 },
        { address: "B", lat: 3, lng: 4 },
      ],
    };
    expect(countItineraryNavigationNodes(it)).toBe(2);
    expect(itineraryCanOpenNavigation(it)).toBe(true);
  });

  it("one property plus explicit start", () => {
    const it = {
      stops: [{ address: "A", lat: 1, lng: 1 }],
      start: { label: "Office", address: "O", lat: 0, lng: 0 },
      end_mode: "last_property" as const,
    };
    expect(countItineraryNavigationNodes(it)).toBe(2);
    expect(itineraryCanOpenNavigation(it)).toBe(true);
  });

  it("insufficient coords", () => {
    const it = {
      stops: [{ address: "A", lat: null, lng: null }],
      start: { address: "O", lat: null, lng: null },
    };
    expect(itineraryCanOpenNavigation(it)).toBe(false);
  });
});
