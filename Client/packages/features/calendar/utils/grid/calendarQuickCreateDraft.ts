import {
  CREATE_EVENT_TIME_STEP_MINUTES,
  parseHourMinute24,
  quantizeHourMinute,
} from "packages/utils/calendar/createEvent/eventFormGooglePayload";
import { dayjs } from "packages/utils/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

export function minutesFromMidnightToHhmm(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Quantizes start minutes, then picks a default end1h later on the same local calendar day
 * (may be shortened toward 23:59 when the hour would cross midnight).
 */
export function defaultTimedRangeFromMinutes(
  startYmd: string,
  minutesFromMidnight: number,
  stepMinutes: number = CREATE_EVENT_TIME_STEP_MINUTES
): { startTime: string; endTime: string } {
  const q = quantizeHourMinute(
    Math.floor(minutesFromMidnight / 60),
    minutesFromMidnight % 60,
    stepMinutes
  );
  const start = dayjs(startYmd, "YYYY-MM-DD", true)
    .hour(q.hour)
    .minute(q.minute)
    .second(0)
    .millisecond(0);
  let end = start.add(1, "hour");
  if (end.format("YYYY-MM-DD") !== startYmd) {
    end = dayjs(startYmd, "YYYY-MM-DD", true).hour(23).minute(59).second(0).millisecond(0);
  }
  if (!end.isAfter(start)) {
    end = start.add(1, "minute");
    if (end.format("YYYY-MM-DD") !== startYmd) {
      end = dayjs(startYmd, "YYYY-MM-DD", true).hour(23).minute(59).second(0).millisecond(0);
    }
  }
  return {
    startTime: `${String(q.hour).padStart(2, "0")}:${String(q.minute).padStart(2, "0")}`,
    endTime: `${String(end.hour()).padStart(2, "0")}:${String(end.minute()).padStart(2, "0")}`,
  };
}

export function buildOptimisticTimedDraftEvent(p: {
  id: string;
  summary: string;
  calendarId?: string;
  startYmd: string;
  startTime: string;
  endTime: string;
}): ExtendedGoogleEvent {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const sh = parseHourMinute24(p.startTime);
  const eh = parseHourMinute24(p.endTime);
  if (!sh || !eh) {
    throw new Error("Invalid draft time");
  }
  const start = dayjs(p.startYmd, "YYYY-MM-DD", true)
    .hour(sh.hour)
    .minute(sh.minute)
    .second(0)
    .millisecond(0);
  const end = dayjs(p.startYmd, "YYYY-MM-DD", true)
    .hour(eh.hour)
    .minute(eh.minute)
    .second(0)
    .millisecond(0);
  return {
    id: p.id,
    summary: p.summary,
    calendarId: p.calendarId,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end: { dateTime: end.toISOString(), timeZone: tz },
    isOptimisticCalendarDraft: true,
  };
}

export function buildOptimisticAllDayDraftEvent(p: {
  id: string;
  summary: string;
  calendarId?: string;
  startYmd: string;
}): ExtendedGoogleEvent {
  const endExclusive = dayjs(p.startYmd, "YYYY-MM-DD", true).add(1, "day").format("YYYY-MM-DD");
  return {
    id: p.id,
    summary: p.summary,
    calendarId: p.calendarId,
    start: { date: p.startYmd },
    end: { date: endExclusive },
    isOptimisticCalendarDraft: true,
  };
}
