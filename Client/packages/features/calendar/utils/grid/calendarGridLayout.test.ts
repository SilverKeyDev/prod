import { describe, expect, it } from "vitest";

import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

import {
  layoutTimedEventsForColumn,
  partitionCalendarEventsForDay,
  type TimedEventSlice,
  timedEventSlicesForDay,
} from "./calendarGridLayout";

function timed(id: string, day: string, start: string, end: string): GoogleEvent {
  return {
    id,
    summary: id,
    start: { dateTime: `${day}T${start}:00` },
    end: { dateTime: `${day}T${end}:00` },
  } as GoogleEvent;
}

describe("partitionCalendarEventsForDay", () => {
  it("collects all-day events that include the day", () => {
    const ev = {
      id: "a",
      summary: "Trip",
      start: { date: "2026-06-10" },
      end: { date: "2026-06-13" },
    } as GoogleEvent;
    const { allDay, timedSlices } = partitionCalendarEventsForDay([ev], "2026-06-11");
    expect(allDay).toHaveLength(1);
    expect(timedSlices).toHaveLength(0);
  });

  it("extracts timed slices for the local day", () => {
    const ev = timed("1", "2026-06-10", "14:00", "15:30");
    const { timedSlices } = partitionCalendarEventsForDay([ev], "2026-06-10");
    expect(timedSlices).toHaveLength(1);
    expect(timedSlices[0].startMin).toBe(14 * 60);
    expect(timedSlices[0].endMin).toBeCloseTo(15 * 60 + 30, 0);
  });
});

describe("timedEventSlicesForDay", () => {
  it("returns an interval for an event that overlaps the day", () => {
    const ev = timed("x", "2026-06-10", "09:00", "10:00");
    const slice = timedEventSlicesForDay(ev, "2026-06-10");
    expect(slice).not.toBeNull();
    expect(slice!.startMin).toBe(9 * 60);
    expect(slice!.endMin).toBe(10 * 60);
  });
});

describe("layoutTimedEventsForColumn", () => {
  it("places two overlapping events in two lanes", () => {
    const a: TimedEventSlice = {
      event: timed("a", "2026-01-01", "10:00", "11:00"),
      startMin: 600,
      endMin: 660,
    };
    const b: TimedEventSlice = {
      event: timed("b", "2026-01-01", "10:30", "11:30"),
      startMin: 630,
      endMin: 690,
    };
    const placed = layoutTimedEventsForColumn([a, b]);
    expect(placed).toHaveLength(2);
    expect(placed[0].laneCount).toBe(2);
    expect(new Set(placed.map((p) => p.laneIndex)).size).toBe(2);
  });

  it("stacks sequential events in one lane", () => {
    const a: TimedEventSlice = {
      event: timed("a", "2026-01-01", "09:00", "10:00"),
      startMin: 540,
      endMin: 600,
    };
    const b: TimedEventSlice = {
      event: timed("b", "2026-01-01", "10:00", "11:00"),
      startMin: 600,
      endMin: 660,
    };
    const placed = layoutTimedEventsForColumn([a, b]);
    expect(placed.every((p) => p.laneIndex === 0)).toBe(true);
    expect(placed[0].laneCount).toBe(1);
  });
});
