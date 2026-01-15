import type { ExtendedGoogleEvent, Calendar } from "../../schemas/calendar";
import { getEventStartDate } from "./eventParsing";
import { calculateCalendarDateRange } from "./date";

/**
 * Filter events by enabled calendars
 */
export function filterEventsByCalendars(
  events: ExtendedGoogleEvent[],
  enabledCalendarIds: Set<string>,
  calendars: Calendar[]
): ExtendedGoogleEvent[] {
  if (enabledCalendarIds.size === 0) {
    return [];
  }

  if (!calendars || calendars.length === 0) {
    return events.filter(
      (event) => event.calendarId && enabledCalendarIds.has(event.calendarId)
    );
  }

  return events.filter((event) => {
    // Always include client events (marked with isClientEvent)
    if (event.isClientEvent === true) {
      return true;
    }
    
    if (event.calendarId) {
      return enabledCalendarIds.has(event.calendarId);
    }
    // For events without calendarId, check if primary calendar is enabled
    const primaryCalendar =
      calendars.find((cal) => cal.primary) || calendars[0];
    return primaryCalendar?.id && enabledCalendarIds.has(primaryCalendar.id);
  });
}

/**
 * Filter events for current 5-week period
 * Uses calculateCalendarDateRange to get the standard date range
 * 
 * @param events - Events to filter
 * @param date - Optional date to calculate range from. Defaults to today.
 */
export function filterCurrentPeriodEvents(events: ExtendedGoogleEvent[], date?: Date): ExtendedGoogleEvent[] {
  const { timeMin, timeMax } = calculateCalendarDateRange(date);
  const start = new Date(timeMin);
  const end = new Date(timeMax);

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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  nextWeek.setHours(23, 59, 59, 999);

  return events.filter((event) => {
    if (silverKeyCalendarId && event.calendarId !== silverKeyCalendarId) {
      return false;
    }
    const eventDate = getEventStartDate(event);
    if (!eventDate) return false;
    return eventDate >= today && eventDate <= nextWeek;
  });
}
