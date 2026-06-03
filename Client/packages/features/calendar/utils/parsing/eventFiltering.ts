import type { ExtendedGoogleEvent } from "packages/features/calendar/types/calendar";
import { calculateCalendarDateRange } from "packages/utils/calendar/core/date";
import { getEventStartDate } from "packages/utils/calendar/parsing/eventParsing";
import { dateNow, dateParseISO } from "packages/utils/date";

/**
 * Filter events for current 4-week period
 * Uses calculateCalendarDateRange to get the standard date range
 *
 * @param events - Events to filter
 * @param date - Optional date to calculate range from. Defaults to today.
 */
export function filterCurrentPeriodEvents(
  events: ExtendedGoogleEvent[],
  date?: Date
): ExtendedGoogleEvent[] {
  const { timeMin, timeMax } = calculateCalendarDateRange(date);
  const start = dateParseISO(timeMin).toDate();
  const end = dateParseISO(timeMax).toDate();

  return events.filter((event) => {
    const eventDate = getEventStartDate(event);
    if (!eventDate) return false;
    return eventDate >= start && eventDate <= end;
  });
}

/**
 * Filter upcoming events (next 7 days) - only from SilverKey calendar
 * Uses calculateCalendarDateRange to get the standard date range, then filters to next 7 days
 */
export function filterUpcomingEvents(
  events: ExtendedGoogleEvent[],
  silverKeyCalendarId: string | null
): ExtendedGoogleEvent[] {
  const today = dateNow().startOf("day").toDate();
  const nextWeek = dateNow().startOf("day").add(7, "day").endOf("day").toDate();

  return events.filter((event) => {
    if (silverKeyCalendarId && event.calendarId !== silverKeyCalendarId) {
      return false;
    }
    const eventDate = getEventStartDate(event);
    if (!eventDate) return false;
    return eventDate >= today && eventDate <= nextWeek;
  });
}

/**
 * Agenda "display all" — same calendar scope as {@link filterUpcomingEvents}
 * (SilverKey-only when `silverKeyCalendarId` is set), but any past or future start time.
 */
export function filterAgendaEventsAllTime(
  events: ExtendedGoogleEvent[],
  silverKeyCalendarId: string | null
): ExtendedGoogleEvent[] {
  return events.filter((event) => {
    if (silverKeyCalendarId && event.calendarId !== silverKeyCalendarId) {
      return false;
    }
    const eventDate = getEventStartDate(event);
    if (!eventDate) return false;
    return true;
  });
}
