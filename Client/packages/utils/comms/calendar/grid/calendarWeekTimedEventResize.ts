import type { components } from "packages/types/api.generated";
import type { ExtendedGoogleEvent } from "packages/types/calendar/extendedGoogleEvent";
import {
  buildCreateEventGoogleStartEnd,
  CREATE_EVENT_TIME_STEP_MINUTES,
  quantizeMinutesFromMidnight,
} from "packages/utils/comms/calendar/createEvent/eventFormGooglePayload";
import {
  eventSpansMultipleLocalDays,
  getEventLocalDayKeys,
} from "packages/utils/comms/calendar/parsing/eventParsing";

type GoogleEvent = components["schemas"]["GoogleEvent"];

function formatHm(totalMinutes: number): string {
  const capped = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  const h = Math.floor(capped / 60);
  const m = capped % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/**
 * Timed events that occupy a single local day can be resized in the week grid.
 */
export function canResizeWeekTimedEvent(ev: ExtendedGoogleEvent): boolean {
  if (!ev.id || ev.isOptimisticCalendarDraft || ev.isClientEvent || ev.isProfileAvailabilityEvent) {
    return false;
  }
  if (ev.start?.date && !ev.start?.dateTime) {
    return false;
  }
  if (!ev.start?.dateTime || !ev.end?.dateTime) {
    return false;
  }
  return !eventSpansMultipleLocalDays(ev);
}

export function clampSnapTimedRangeForSameDay(
  startMin: number,
  endMin: number,
  stepMinutes: number = CREATE_EVENT_TIME_STEP_MINUTES
): { startMin: number; endMin: number } {
  let s = quantizeMinutesFromMidnight(Math.max(0, startMin), stepMinutes);
  let e = quantizeMinutesFromMidnight(Math.max(0, endMin), stepMinutes);
  const maxEnd = 24 * 60 - 1;
  e = Math.min(e, maxEnd);
  s = Math.min(s, maxEnd - stepMinutes);
  if (e <= s) {
    e = Math.min(s + stepMinutes, maxEnd);
  }
  return { startMin: s, endMin: e };
}

/**
 * Builds a `GoogleEvent` patch with updated `start` / `end` for a same-day timed event.
 */
export function buildWeekTimedEventResizeGoogleEvent(
  ev: ExtendedGoogleEvent,
  dayKey: string,
  startMin: number,
  endMin: number
): GoogleEvent {
  const keys = getEventLocalDayKeys(ev);
  if (keys.length !== 1 || keys[0] !== dayKey) {
    throw new Error("Event is not a single-day event in this column.");
  }
  const { startMin: sm, endMin: em } = clampSnapTimedRangeForSameDay(startMin, endMin);
  const se = buildCreateEventGoogleStartEnd({
    isAllDay: false,
    startDate: dayKey,
    endDate: dayKey,
    startTime: formatHm(sm),
    endTime: formatHm(em),
    timeStepMinutes: CREATE_EVENT_TIME_STEP_MINUTES,
  });
  return { ...ev, start: se.start, end: se.end };
}
