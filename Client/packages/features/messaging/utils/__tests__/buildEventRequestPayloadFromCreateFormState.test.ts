import { describe, expect, it } from "vitest";

import type { BuildEventRequestPayloadFromCreateFormStateInput } from "@/features/messaging/utils/buildEventRequestPayloadFromCreateFormState";
import { buildEventRequestPayloadFromCreateFormState } from "@/features/messaging/utils/buildEventRequestPayloadFromCreateFormState";

const baseInput: BuildEventRequestPayloadFromCreateFormStateInput = {
  eventTitle: "Property viewings",
  eventDescription: "",
  eventLocation: "",
  startDate: "2026-05-07",
  endDate: "2026-05-07",
  startTime: "09:00",
  endTime: "10:00",
  isAllDay: false,
  isPropertyViewing: true,
  viewingStops: [],
  viewingStartSelection: { kind: "omit" },
  viewingTourAnchors: [],
  viewingEndMode: "last_property",
  viewingEndFixed: null,
};

describe("buildEventRequestPayloadFromCreateFormState", () => {
  it("returns error when property viewing has no stop addresses", () => {
    const r = buildEventRequestPayloadFromCreateFormState(baseInput);
    expect("error" in r).toBe(true);
    if ("error" in r) {
      expect(r.error.length).toBeGreaterThan(0);
    }
  });

  it("includes itinerary when property viewing has at least one address", () => {
    const r = buildEventRequestPayloadFromCreateFormState({
      ...baseInput,
      viewingStops: [{ address: "123 Main St" }],
    });
    expect("payload" in r).toBe(true);
    if ("payload" in r) {
      expect(r.payload.itinerary?.stops?.length).toBe(1);
    }
  });
});
