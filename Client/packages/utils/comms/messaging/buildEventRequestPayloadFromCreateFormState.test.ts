import { describe, expect, it } from "vitest";

import type { BuildEventRequestPayloadFromCreateFormStateInput } from "./buildEventRequestPayloadFromCreateFormState";
import { buildEventRequestPayloadFromCreateFormState } from "./buildEventRequestPayloadFromCreateFormState";

const baseInput: BuildEventRequestPayloadFromCreateFormStateInput = {
  eventTitle: "Meeting",
  eventDescription: "Notes",
  eventLocation: "123 Main St",
  startDate: "2026-05-07",
  endDate: "2026-05-07",
  startTime: "09:00",
  endTime: "10:00",
  isAllDay: false,
};

describe("buildEventRequestPayloadFromCreateFormState", () => {
  it("builds payload with title, schedule, location, and description", () => {
    const r = buildEventRequestPayloadFromCreateFormState(baseInput);
    expect("payload" in r).toBe(true);
    if ("payload" in r) {
      expect(r.payload.title).toBe("Meeting");
      expect(r.payload.description).toBe("Notes");
      expect(r.payload.location).toBe("123 Main St");
      expect(r.payload.start).toMatch(/2026-05-07/);
      expect(r.payload.end).toMatch(/2026-05-07/);
    }
  });

  it("returns error when title is empty", () => {
    const r = buildEventRequestPayloadFromCreateFormState({
      ...baseInput,
      eventTitle: "   ",
    });
    expect("error" in r).toBe(true);
  });
});
