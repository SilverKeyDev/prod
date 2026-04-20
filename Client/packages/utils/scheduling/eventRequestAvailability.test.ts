import { describe, expect, it } from "vitest";

import type { BuyerAvailabilityPrefs } from "packages/features/profile/types/buyerPreferenceExtensions";
import type { FreebusyTimeBlock } from "packages/schemas/scheduling";

import {
  hasAnyAvailableSlotOnDate,
  hasConfiguredBuyerAvailabilitySlots,
  isEventRequestSlotAvailable,
} from "./eventRequestAvailability";

const STEP = 30;

describe("eventRequestAvailability", () => {
  it("treats full day as available when profile has no slots and calendar is free", () => {
    expect(
      isEventRequestSlotAvailable({
        eventDateYmd: "2026-06-15",
        eventTimeHm: "14:00",
        stepMinutes: STEP,
        prefs: undefined,
        busyBlocks: [],
      })
    ).toBe(true);
  });

  it("blocks slot overlapping busy interval", () => {
    const busy: FreebusyTimeBlock[] = [
      { start: "2026-06-15T13:00:00.000Z", end: "2026-06-15T15:00:00.000Z" },
    ];
    const prefs: BuyerAvailabilityPrefs = {
      timezone: "UTC",
      weekly: [{ id: "w1", weekday: 1, start: "08:00", end: "20:00" }],
    };
    expect(
      isEventRequestSlotAvailable({
        eventDateYmd: "2026-06-15",
        eventTimeHm: "14:00",
        stepMinutes: STEP,
        prefs,
        busyBlocks: busy,
      })
    ).toBe(false);
  });

  it("requires profile window when weekly rules exist", () => {
    const prefs: BuyerAvailabilityPrefs = {
      timezone: "UTC",
      weekly: [{ id: "w1", weekday: 1, start: "10:00", end: "12:00" }],
    };
    expect(
      isEventRequestSlotAvailable({
        eventDateYmd: "2026-06-15",
        eventTimeHm: "09:00",
        stepMinutes: STEP,
        prefs,
        busyBlocks: [],
      })
    ).toBe(false);
    expect(
      isEventRequestSlotAvailable({
        eventDateYmd: "2026-06-15",
        eventTimeHm: "10:30",
        stepMinutes: STEP,
        prefs,
        busyBlocks: [],
      })
    ).toBe(true);
  });

  it("hasConfiguredBuyerAvailabilitySlots is false without weekly or oneOff", () => {
    expect(hasConfiguredBuyerAvailabilitySlots({ timezone: "UTC" })).toBe(false);
    expect(
      hasConfiguredBuyerAvailabilitySlots({
        weekly: [{ id: "x", weekday: 0, start: "09:00", end: "10:00" }],
      })
    ).toBe(true);
  });

  it("hasAnyAvailableSlotOnDate respects profile and busy", () => {
    const prefs: BuyerAvailabilityPrefs = {
      timezone: "UTC",
      weekly: [{ id: "w1", weekday: 1, start: "10:00", end: "11:00" }],
    };
    const busy: FreebusyTimeBlock[] = [
      { start: "2026-06-15T10:00:00.000Z", end: "2026-06-15T10:30:00.000Z" },
    ];
    expect(
      hasAnyAvailableSlotOnDate({
        eventDateYmd: "2026-06-15",
        stepMinutes: STEP,
        prefs,
        busyBlocks: busy,
      })
    ).toBe(true);
    expect(
      hasAnyAvailableSlotOnDate({
        eventDateYmd: "2026-06-15",
        stepMinutes: STEP,
        prefs,
        busyBlocks: [{ start: "2026-06-15T10:00:00.000Z", end: "2026-06-15T11:00:00.000Z" }],
      })
    ).toBe(false);
  });
});
