import { dateParseISO } from "packages/utils/date";

import type { GoogleEvent } from "@/features/calendar/types/googleEvent";

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
    return dateParseISO(eventEnd).toDate();
  } catch {
    return startDate;
  }
}
