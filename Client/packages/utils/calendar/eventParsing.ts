import type { components } from "packages/types/api.generated";
import { dateParseISO, dayjs } from "packages/utils/date";

type GoogleEvent = components["schemas"]["GoogleEvent"];

/**
 * Extract start date from event
 */
export function getEventStartDate(event: GoogleEvent): Date | null {
  const eventStart = event.start?.dateTime ?? event.start?.date;
  if (!eventStart) return null;
  try {
    return dateParseISO(eventStart).toDate();
  } catch {
    return null;
  }
}

/**
 * Extract end date from event (falls back to start if no end)
 */
export function getEventEndDate(event: GoogleEvent): Date | null {
  const startDate = getEventStartDate(event);
  if (!startDate) return null;

  const eventEnd = event.end?.dateTime ?? event.end?.date;
  if (!eventEnd) return startDate;

  try {
    if (event.end?.date && !event.end?.dateTime) {
      return dayjs(event.end.date, "YYYY-MM-DD", true).subtract(1, "day").endOf("day").toDate();
    }
    return dateParseISO(eventEnd).toDate();
  } catch {
    return startDate;
  }
}

/**
 * Local calendar days (YYYY-MM-DD) this event occupies — one entry per day for multi-day / range events.
 */
export function getEventLocalDayKeys(event: GoogleEvent): string[] {
  const start = getEventStartDate(event);
  const end = getEventEndDate(event);
  if (!start || !end) return [];

  let cursor = dayjs(start).startOf("day");
  const endDay = dayjs(end).startOf("day");
  if (endDay.isBefore(cursor)) {
    return [cursor.format("YYYY-MM-DD")];
  }

  const keys: string[] = [];
  while (!cursor.isAfter(endDay)) {
    keys.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }
  return keys;
}

export function getEventFirstLocalDayKey(event: GoogleEvent): string | null {
  const keys = getEventLocalDayKeys(event);
  return keys[0] ?? null;
}

export function eventSpansMultipleLocalDays(event: GoogleEvent): boolean {
  return getEventLocalDayKeys(event).length > 1;
}
