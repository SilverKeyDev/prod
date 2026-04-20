import { dateParseISO, dayjs } from "packages/utils/date";

import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import { getEventLocalDayKeys } from "@/features/calendar/utils/parsing/eventParsing";

const MINUTES_PER_DAY = 24 * 60;

export type TimedEventSlice = {
  event: GoogleEvent;
  startMin: number;
  endMin: number;
};

export type PlacedTimedEventSlice = TimedEventSlice & {
  laneIndex: number;
  laneCount: number;
};

function isAllDayEvent(event: GoogleEvent): boolean {
  return Boolean(event.start?.date && !event.start?.dateTime);
}

/**
 * Local minutes from midnight for a UTC ms timestamp or date-like value (floating, may exceed 1440 for multi-day — clip in caller).
 */
export function minutesSinceMidnight(value: number | Date): number {
  const d = dayjs(value);
  return d.hour() * 60 + d.minute() + d.second() / 60;
}

/**
 * Timed intervals intersecting `dayKey` (YYYY-MM-DD), clipped to that local calendar day.
 */
export function timedEventSlicesForDay(event: GoogleEvent, dayKey: string): TimedEventSlice | null {
  if (isAllDayEvent(event)) return null;
  const startStr = event.start?.dateTime;
  const endStr = event.end?.dateTime;
  if (!startStr || !endStr) return null;

  let start: ReturnType<typeof dateParseISO>;
  let end: ReturnType<typeof dateParseISO>;
  try {
    start = dateParseISO(startStr);
    end = dateParseISO(endStr);
  } catch {
    return null;
  }

  const day = dayjs(dayKey, "YYYY-MM-DD", true);
  if (!day.isValid()) return null;
  const dayStart = day.startOf("day");
  const dayEnd = day.endOf("day");

  const startMs = start.valueOf();
  const endMs = end.valueOf();
  const windowStart = dayStart.valueOf();
  const windowEnd = dayEnd.valueOf();
  if (endMs <= windowStart || startMs > windowEnd) return null;

  const clipStart = Math.max(startMs, windowStart);
  const clipEnd = Math.min(endMs, windowEnd);
  let startMin = minutesSinceMidnight(clipStart);
  let endMin = minutesSinceMidnight(clipEnd);
  if (clipEnd >= dayEnd.valueOf() && endMs > windowEnd) {
    endMin = MINUTES_PER_DAY;
  }
  if (clipStart <= windowStart && startMs < windowStart) {
    startMin = 0;
  }
  if (endMin <= startMin) {
    endMin = Math.min(startMin + 1, MINUTES_PER_DAY);
  }
  return { event, startMin, endMin };
}

export type PartitionedDayEvents = {
  allDay: GoogleEvent[];
  timedSlices: TimedEventSlice[];
};

export function partitionCalendarEventsForDay(
  events: GoogleEvent[],
  dayKey: string
): PartitionedDayEvents {
  const allDay: GoogleEvent[] = [];
  const timedSlices: TimedEventSlice[] = [];

  for (const ev of events) {
    if (isAllDayEvent(ev)) {
      if (getEventLocalDayKeys(ev).includes(dayKey)) {
        allDay.push(ev);
      }
      continue;
    }
    const slice = timedEventSlicesForDay(ev, dayKey);
    if (slice) timedSlices.push(slice);
  }

  return { allDay, timedSlices };
}

/**
 * Assign non-overlapping lanes (first-fit). All slices share `laneCount` = columns used.
 */
export function layoutTimedEventsForColumn(slices: TimedEventSlice[]): PlacedTimedEventSlice[] {
  if (slices.length === 0) return [];

  const sorted = [...slices].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const columnLastEnd: number[] = [];

  const withLanes = sorted.map((ev) => {
    let lane = columnLastEnd.findIndex((lastEnd) => lastEnd <= ev.startMin);
    if (lane === -1) {
      lane = columnLastEnd.length;
      columnLastEnd.push(ev.endMin);
    } else {
      columnLastEnd[lane] = Math.max(columnLastEnd[lane], ev.endMin);
    }
    return { ...ev, laneIndex: lane };
  });

  const laneCount = columnLastEnd.length;
  return withLanes.map((row) => ({ ...row, laneCount }));
}
