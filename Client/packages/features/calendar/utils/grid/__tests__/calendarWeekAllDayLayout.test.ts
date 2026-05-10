import { describe, expect, it } from "vitest";

import {
  layoutWeekAllDayEventLanes,
  weekAllDayColumnSpan,
} from "packages/features/calendar/utils/grid/calendarWeekAllDayLayout";

import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

function allDay(ev: Partial<GoogleEvent> & Pick<GoogleEvent, "start" | "end">): GoogleEvent {
  return {
    summary: "E",
    ...ev,
  } as GoogleEvent;
}

describe("weekAllDayColumnSpan", () => {
  const week = ["2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"];

  it("returns null for timed events", () => {
    const ev = allDay({
      start: { dateTime: "2026-06-08T14:00:00", timeZone: "UTC" },
      end: { dateTime: "2026-06-08T15:00:00", timeZone: "UTC" },
    });
    expect(weekAllDayColumnSpan(ev, week)).toBeNull();
  });

  it("maps single-day all-day to one column", () => {
    const ev = allDay({
      start: { date: "2026-06-08", dateTime: undefined },
      end: { date: "2026-06-09", dateTime: undefined },
    });
    expect(weekAllDayColumnSpan(ev, week)).toEqual({ startCol: 1, endCol: 1 });
  });

  it("clips multi-day span to visible week", () => {
    const ev = allDay({
      start: { date: "2026-06-05", dateTime: undefined },
      end: { date: "2026-06-11", dateTime: undefined },
    });
    expect(weekAllDayColumnSpan(ev, week)).toEqual({ startCol: 0, endCol: 3 });
  });
});

describe("layoutWeekAllDayEventLanes", () => {
  const week = ["2026-06-07", "2026-06-08", "2026-06-09", "2026-06-10"];

  it("assigns overlapping spans to separate lanes", () => {
    const a = allDay({
      id: "a",
      start: { date: "2026-06-07", dateTime: undefined },
      end: { date: "2026-06-09", dateTime: undefined },
    });
    const b = allDay({
      id: "b",
      start: { date: "2026-06-08", dateTime: undefined },
      end: { date: "2026-06-10", dateTime: undefined },
    });
    const { placed, laneCount } = layoutWeekAllDayEventLanes([a, b], week);
    expect(laneCount).toBe(2);
    expect(placed.find((p) => p.event.id === "a")?.lane).not.toBe(
      placed.find((p) => p.event.id === "b")?.lane
    );
  });

  it("dedupes duplicate event references by id", () => {
    const a = allDay({
      id: "x",
      start: { date: "2026-06-08", dateTime: undefined },
      end: { date: "2026-06-09", dateTime: undefined },
    });
    const { placed, laneCount } = layoutWeekAllDayEventLanes([a, a], week);
    expect(placed).toHaveLength(1);
    expect(laneCount).toBe(1);
  });
});
