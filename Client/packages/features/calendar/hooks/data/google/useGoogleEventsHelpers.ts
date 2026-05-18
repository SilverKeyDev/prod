import type { GoogleEvent } from "packages/api";
import { googleCalendarApi } from "packages/features/calendar/api";
import { log, LOG_CATEGORIES } from "packages/logger";

/**
 * Build the queryFn for a single calendar's events list.
 */
export function buildEventsListQueryFn(
  calendarId: string,
  timeMin: string | undefined,
  timeMax: string | undefined
): () => Promise<GoogleEvent[]> {
  return async () => {
    log.debug(LOG_CATEGORIES.CALENDAR, "Fetching Google Calendar events (not in cache)", {
      calendarId,
    });
    const response = await googleCalendarApi.listEvents({
      calendarId,
      timeMin,
      timeMax,
    });
    if (!response.success) {
      throw new Error(response.error ?? "Failed to fetch events");
    }
    const events = (response.data?.items ?? []).map((event) => ({
      ...event,
      calendarId: event.calendarId || calendarId,
    }));
    log.debug(LOG_CATEGORIES.CALENDAR, "Fetched Google Calendar events", {
      calendarId,
      eventCount: events.length,
    });
    return events;
  };
}
