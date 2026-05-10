import type { GoogleEvent } from "@/features/calendar/types/googleEvent";
import { getEventLocalDayKeys } from "@/features/calendar/utils/parsing/eventParsing";

import { isAllDayGoogleEvent } from "./calendarGridLayout";

export type WeekAllDayPlacedEvent = {
  event: GoogleEvent;
  startCol: number;
  endCol: number;
  lane: number;
};

/**
 * Maps an all-day event to week column indices (inclusive) visible in `dayKeys`.
 */
export function weekAllDayColumnSpan(
  event: GoogleEvent,
  dayKeys: readonly string[]
): { startCol: number; endCol: number } | null {
  if (!isAllDayGoogleEvent(event)) return null;
  const idxByKey = new Map(dayKeys.map((k, i) => [k, i]));
  let startCol = Number.POSITIVE_INFINITY;
  let endCol = Number.NEGATIVE_INFINITY;
  for (const k of getEventLocalDayKeys(event)) {
    const idx = idxByKey.get(k);
    if (idx !== undefined) {
      startCol = Math.min(startCol, idx);
      endCol = Math.max(endCol, idx);
    }
  }
  if (!Number.isFinite(startCol)) return null;
  return { startCol, endCol };
}

function eventDedupeKey(event: GoogleEvent): string {
  if (event.id != null && String(event.id).length > 0) {
    return `id:${String(event.id)}`;
  }
  const s = event.start?.date ?? event.start?.dateTime ?? "";
  const e = event.end?.date ?? event.end?.dateTime ?? "";
  return `bare:${s}:${e}:${event.summary ?? ""}`;
}

/**
 * Builds non-overlapping horizontal lanes for all-day chips in week view (Apple Calendar–style spanning).
 */
export function layoutWeekAllDayEventLanes(
  events: GoogleEvent[],
  dayKeys: readonly string[]
): { placed: WeekAllDayPlacedEvent[]; laneCount: number } {
  const seen = new Set<string>();
  const bars: { event: GoogleEvent; startCol: number; endCol: number }[] = [];
  for (const ev of events) {
    const span = weekAllDayColumnSpan(ev, dayKeys);
    if (!span) continue;
    const dk = eventDedupeKey(ev);
    if (seen.has(dk)) continue;
    seen.add(dk);
    bars.push({ event: ev, ...span });
  }

  if (bars.length === 0) {
    return { placed: [], laneCount: 0 };
  }

  const sorted = [...bars].sort((a, b) => {
    if (a.startCol !== b.startCol) return a.startCol - b.startCol;
    return b.endCol - b.startCol - (a.endCol - a.startCol);
  });

  /** Last occupied end column per lane (`laneLastEnd[col]`). */
  const laneLastEndCol: number[] = [];
  const placed: WeekAllDayPlacedEvent[] = sorted.map((bar) => {
    let lane = laneLastEndCol.findIndex((lastEnd) => bar.startCol > lastEnd);
    if (lane === -1) {
      lane = laneLastEndCol.length;
      laneLastEndCol.push(bar.endCol);
    } else {
      laneLastEndCol[lane] = Math.max(laneLastEndCol[lane], bar.endCol);
    }
    return { ...bar, lane };
  });

  const laneCount = laneLastEndCol.length;
  return { placed, laneCount };
}
