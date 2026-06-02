import { describe, expect, it } from "vitest";

import {
  canResizeWeekTimedEvent,
  clampSnapTimedRangeForSameDay,
} from "packages/utils/calendar/grid/calendarWeekTimedEventResize";

describe("canResizeWeekTimedEvent", () => {
  it("returns false for all-day events", () => {
    expect(
      canResizeWeekTimedEvent({
        id: "1",
        summary: "x",
        start: { date: "2026-04-18" },
        end: { date: "2026-04-19" },
      })
    ).toBe(false);
  });

  it("returns false for optimistic drafts", () => {
    expect(
      canResizeWeekTimedEvent({
        id: "d",
        summary: "x",
        start: { dateTime: "2026-04-18T10:00:00-07:00" },
        end: { dateTime: "2026-04-18T11:00:00-07:00" },
        isOptimisticCalendarDraft: true,
      })
    ).toBe(false);
  });
});

describe("clampSnapTimedRangeForSameDay", () => {
  it("snaps to 15 minutes and enforces minimum duration", () => {
    expect(clampSnapTimedRangeForSameDay(7, 22, 15)).toEqual({ startMin: 0, endMin: 15 });
  });

  it("does not allow end past end of day", () => {
    const r = clampSnapTimedRangeForSameDay(60, 24 * 60 + 30, 15);
    expect(r.endMin).toBeLessThanOrEqual(24 * 60 - 1);
    expect(r.endMin).toBeGreaterThan(r.startMin);
  });
});

describe("canResizeWeekTimedEvent (timed single-day)", () => {
  it("returns true for a simple timed event", () => {
    expect(
      canResizeWeekTimedEvent({
        id: "evt-1",
        summary: "Meeting",
        start: { dateTime: "2026-04-18T10:00:00-07:00" },
        end: { dateTime: "2026-04-18T11:00:00-07:00" },
      })
    ).toBe(true);
  });
});
