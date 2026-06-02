import { describe, expect, it } from "vitest";

import {
  eventSpansMultipleLocalDays,
  getEventFirstLocalDayKey,
  getEventLocalDayKeys,
} from "packages/utils/calendar/parsing/eventParsing";

import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

function allDayEvent(startYmd: string, endExclusiveYmd: string): GoogleEvent {
  return {
    id: "1",
    summary: "Trip",
    start: { date: startYmd },
    end: { date: endExclusiveYmd },
  } as GoogleEvent;
}

describe("getEventLocalDayKeys", () => {
  it("includes each calendar day for multi-day all-day events (exclusive end)", () => {
    const ev = allDayEvent("2026-06-10", "2026-06-13");
    expect(getEventLocalDayKeys(ev)).toEqual(["2026-06-10", "2026-06-11", "2026-06-12"]);
  });

  it("returns one key for single-day all-day event", () => {
    const ev = allDayEvent("2026-06-10", "2026-06-11");
    expect(getEventLocalDayKeys(ev)).toEqual(["2026-06-10"]);
  });

  it("returns one key for timed event on one local day", () => {
    const ev = {
      id: "2",
      summary: "Meeting",
      start: { dateTime: "2026-06-10T14:00:00" },
      end: { dateTime: "2026-06-10T15:00:00" },
    } as GoogleEvent;
    expect(getEventLocalDayKeys(ev)).toHaveLength(1);
    expect(getEventLocalDayKeys(ev)[0]).toBe("2026-06-10");
  });
});

describe("eventSpansMultipleLocalDays", () => {
  it("is true for multi-day all-day range", () => {
    expect(eventSpansMultipleLocalDays(allDayEvent("2026-01-01", "2026-01-04"))).toBe(true);
  });

  it("is false for single-day all-day", () => {
    expect(eventSpansMultipleLocalDays(allDayEvent("2026-01-01", "2026-01-02"))).toBe(false);
  });
});

describe("getEventFirstLocalDayKey", () => {
  it("returns first day of range", () => {
    expect(getEventFirstLocalDayKey(allDayEvent("2026-03-01", "2026-03-05"))).toBe("2026-03-01");
  });
});
