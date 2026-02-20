import type { UseQueryResult } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import type { GoogleCalendar, GoogleEvent } from "packages/config/api";
import { googleCalendarApi } from "packages/config/api/calendar/googleCalendar";

/**
 * Resolve "primary" to actual calendar ID from cached calendars; otherwise return the id.
 * Returns null if calendarId is "primary" and no primary calendar is in the cache.
 */
export function resolveCalendarId(
  cachedCalendars: GoogleCalendar[],
  calendarId: string,
): string | null {
  if (calendarId !== "primary") return calendarId;
  const primary = cachedCalendars.find((cal) => cal.primary === true);
  return primary ? primary.id : null;
}

/**
 * Resolve calendarId or calendarIds param to an array of resolved IDs, or null (search all).
 */
export function resolveCalendarIds(
  params: { calendarId?: string; calendarIds?: string[] },
  resolve: (id: string) => string | null,
): string[] | null {
  if (params.calendarIds?.length) {
    const resolved = params.calendarIds
      .map(resolve)
      .filter((id): id is string => id !== null);
    return resolved.length > 0 ? resolved : null;
  }
  if (params.calendarId) {
    const resolved = resolve(params.calendarId);
    return resolved !== null ? [resolved] : null;
  }
  return [];
}

/**
 * Return calendar IDs that have no cached data.
 */
export function getCalendarsWithoutCache(
  calendarIds: string[] | null,
  getCached: (calendarId: string) => unknown,
): string[] {
  if (!calendarIds?.length) return [];
  return calendarIds.filter((id) => getCached(id) === undefined);
}

/**
 * Aggregate events from useQueries results.
 */
export function aggregateFetchedEvents(
  results: UseQueryResult<GoogleEvent[], Error>[],
): GoogleEvent[] {
  const out: GoogleEvent[] = [];
  for (const result of results) {
    if (result.data && Array.isArray(result.data)) out.push(...result.data);
  }
  return out;
}

/**
 * Get first error message from useQueries results.
 */
export function getFirstFetchError(
  results: UseQueryResult<GoogleEvent[], Error>[],
): string | null {
  for (const result of results) {
    if (result.error) {
      return result.error instanceof Error
        ? result.error.message
        : String(result.error);
    }
  }
  return null;
}

/**
 * Build the queryFn for a single calendar's events list (for useQueries).
 */
export function buildEventsListQueryFn(
  calendarId: string,
  timeMin: string | undefined,
  timeMax: string | undefined,
): () => Promise<GoogleEvent[]> {
  return async () => {
    log.debug(
      LOG_CATEGORIES.CALENDAR,
      "Fetching Google Calendar events (not in cache)",
      {
        calendarId,
      },
    );
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
