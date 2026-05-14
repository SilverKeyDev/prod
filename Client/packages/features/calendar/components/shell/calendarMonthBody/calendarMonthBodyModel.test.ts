import { describe, expect, it } from "vitest";

import { dateParseISO } from "packages/utils/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import {
  BOTTOM_PAD,
  CHIP_STACK,
  chunkWeeks,
  estimateCellMinHeight,
  type MonthBodyDayCell,
  MORE_LINE,
  sortDayEvents,
  TOP_BAND,
} from "./calendarMonthBodyModel";

function timed(startIso: string): ExtendedGoogleEvent {
  return {
    summary: "E",
    start: { dateTime: startIso, timeZone: "UTC" },
    end: { dateTime: startIso, timeZone: "UTC" },
  } as ExtendedGoogleEvent;
}

function allDayDate(date: string): ExtendedGoogleEvent {
  return {
    summary: "E",
    start: { date },
    end: { date },
  } as ExtendedGoogleEvent;
}

function dayCell(over: Partial<MonthBodyDayCell> = {}): MonthBodyDayCell {
  return {
    key: "k",
    date: dateParseISO("2026-05-01T12:00:00.000Z").toDate(),
    isCurrentMonth: true,
    isPast: false,
    isToday: false,
    count: 0,
    ...over,
  };
}

describe("sortDayEvents", () => {
  it("sorts timed events by start ascending", () => {
    const sorted = sortDayEvents([
      timed("2026-05-01T14:00:00.000Z"),
      timed("2026-05-01T09:00:00.000Z"),
      timed("2026-05-01T11:00:00.000Z"),
    ]);
    expect(sorted.map((e) => e.start?.dateTime)).toEqual([
      "2026-05-01T09:00:00.000Z",
      "2026-05-01T11:00:00.000Z",
      "2026-05-01T14:00:00.000Z",
    ]);
  });

  it("sorts all-day events by date when dateTime is absent", () => {
    const sorted = sortDayEvents([allDayDate("2026-05-02"), allDayDate("2026-05-01")]);
    expect(sorted.map((e) => e.start?.date)).toEqual(["2026-05-01", "2026-05-02"]);
  });

  it("does not mutate the input array", () => {
    const input = [timed("2026-05-01T12:00:00.000Z"), timed("2026-05-01T10:00:00.000Z")];
    const copy = [...input];
    sortDayEvents(input);
    expect(input).toEqual(copy);
  });
});

describe("estimateCellMinHeight", () => {
  it("small screen: empty day uses top band + bottom pad + small text gutter", () => {
    const h = estimateCellMinHeight(dayCell({ count: 0 }), [], false);
    expect(h).toBe(Math.max(40, TOP_BAND + BOTTOM_PAD + 6));
  });

  it("small screen: day with events uses taller content band", () => {
    const h = estimateCellMinHeight(dayCell({ count: 1 }), [], false);
    expect(h).toBe(Math.max(40, TOP_BAND + BOTTOM_PAD + 14));
  });

  it("large screen: no events matches small-text gutter branch", () => {
    const h = estimateCellMinHeight(dayCell(), [], true);
    expect(h).toBe(Math.max(52, TOP_BAND + BOTTOM_PAD + 6));
  });

  it("large screen: one chip row", () => {
    const h = estimateCellMinHeight(dayCell(), [timed("2026-05-01T10:00:00.000Z")], true);
    expect(h).toBe(Math.max(52, TOP_BAND + CHIP_STACK + BOTTOM_PAD));
  });

  it("large screen: three visible chips with no more line", () => {
    const events = [
      timed("2026-05-01T08:00:00.000Z"),
      timed("2026-05-01T09:00:00.000Z"),
      timed("2026-05-01T10:00:00.000Z"),
    ];
    const h = estimateCellMinHeight(dayCell(), events, true);
    expect(h).toBe(Math.max(52, TOP_BAND + 3 * CHIP_STACK + BOTTOM_PAD));
  });

  it("large screen: more than three events adds the more line", () => {
    const events = [
      timed("2026-05-01T08:00:00.000Z"),
      timed("2026-05-01T09:00:00.000Z"),
      timed("2026-05-01T10:00:00.000Z"),
      timed("2026-05-01T11:00:00.000Z"),
    ];
    const h = estimateCellMinHeight(dayCell(), events, true);
    expect(h).toBe(Math.max(52, TOP_BAND + 3 * CHIP_STACK + MORE_LINE + BOTTOM_PAD));
  });
});

describe("chunkWeeks", () => {
  it("returns empty for empty input", () => {
    expect(chunkWeeks([])).toEqual([]);
  });

  it("groups consecutive days into weeks of seven", () => {
    const days = Array.from({ length: 14 }, (_, i) => dayCell({ key: `d-${i}` }));
    const weeks = chunkWeeks(days);
    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[1]).toHaveLength(7);
    expect(weeks[0][0]?.key).toBe("d-0");
    expect(weeks[1][0]?.key).toBe("d-7");
  });

  it("allows a final partial week", () => {
    const days = Array.from({ length: 8 }, (_, i) => dayCell({ key: `d-${i}` }));
    const weeks = chunkWeeks(days);
    expect(weeks).toHaveLength(2);
    expect(weeks[1]).toHaveLength(1);
  });
});
