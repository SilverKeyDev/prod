import type { GoogleEvent } from "packages/api";
import { googleCalendarApi } from "packages/features/calendar/api";
import { log } from "packages/logger";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

/**
 * Build the queryFn for a single calendar's events list.
 */
export function buildEventsListQueryFn(
  calendarId: string,
  timeMin: string | undefined,
  timeMax: string | undefined
): () => Promise<GoogleEvent[]> {
  return async () => {
    log.debug("CALENDAR", "Fetching Google Calendar events (not in cache)", {
      calendarId,
    });
    const response = await googleCalendarApi.listEvents({
      calendarId,
      timeMin,
      timeMax,
    });
    if (!response.success) {
      throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch events"));
    }
    const events = (response.data?.items ?? []).map((event) => ({
      ...event,
      calendarId: event.calendarId || calendarId,
    }));
    log.debug("CALENDAR", "Fetched Google Calendar events", {
      calendarId,
      eventCount: events.length,
    });
    return events;
  };
}
