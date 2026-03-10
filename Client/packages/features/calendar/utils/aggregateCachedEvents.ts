import type { QueryClient } from "@tanstack/react-query";

import type { GoogleEvent } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";
import { dateParseISO } from "packages/utils/date";

function filterEventsByTimeRange(
  data: GoogleEvent[],
  timeMinDate: Date | null,
  timeMaxDate: Date | null
): GoogleEvent[] {
  if (!timeMinDate || !timeMaxDate || data.length === 0) return data;
  return data.filter((event) => {
    const eventStart = event.start?.dateTime
      ? dateParseISO(event.start.dateTime).toDate()
      : event.start?.date
        ? dateParseISO(event.start.date).toDate()
        : null;
    if (!eventStart) return false;
    const eventEnd = event.end?.dateTime
      ? dateParseISO(event.end.dateTime).toDate()
      : event.end?.date
        ? dateParseISO(event.end.date).toDate()
        : eventStart;
    return eventStart <= timeMaxDate && eventEnd >= timeMinDate;
  });
}

function aggregateFromAllCalendars(
  queryClient: QueryClient,
  timeMinDate: Date | null,
  timeMaxDate: Date | null
): GoogleEvent[] {
  const aggregatedEvents: GoogleEvent[] = [];
  const eventsListPrefix = queryKeys.googleCalendar.events();
  const allEventsQueries = queryClient.getQueriesData<GoogleEvent[]>({
    queryKey: eventsListPrefix,
    exact: false,
  });

  for (const [_key, data] of allEventsQueries) {
    if (!data || !Array.isArray(data)) continue;
    const filteredEvents = filterEventsByTimeRange(data, timeMinDate, timeMaxDate);
    aggregatedEvents.push(...filteredEvents);
  }

  if (aggregatedEvents.length > 0) {
    log.debug(
      LOG_CATEGORIES.CALENDAR,
      "Aggregated Google Calendar events from all cached calendars",
      { totalEventCount: aggregatedEvents.length }
    );
  }
  return aggregatedEvents;
}

function aggregateFromCalendarIds(
  queryClient: QueryClient,
  calendarIds: string[],
  timeMin: string | undefined,
  timeMax: string | undefined,
  timeMinDate: Date | null,
  timeMaxDate: Date | null
): GoogleEvent[] {
  const aggregatedEvents: GoogleEvent[] = [];
  const eventsListPrefix = queryKeys.googleCalendar.events();

  for (const calendarId of calendarIds) {
    const queryKey = queryKeys.googleCalendar.eventsList({
      calendarId,
      timeMin,
      timeMax,
    });
    const cachedEvents = queryClient.getQueryData<GoogleEvent[]>(queryKey);

    if (cachedEvents && Array.isArray(cachedEvents)) {
      const eventsWithCalendarId = cachedEvents.map((event) => ({
        ...event,
        calendarId: event.calendarId || calendarId,
      }));
      aggregatedEvents.push(...eventsWithCalendarId);
      if (eventsWithCalendarId.length > 0) {
        log.debug(
          LOG_CATEGORIES.CALENDAR,
          "Retrieved Google Calendar events from cache (exact match)",
          { calendarId, eventCount: eventsWithCalendarId.length }
        );
      }
      continue;
    }

    const allEventsQueries = queryClient.getQueriesData<GoogleEvent[]>({
      queryKey: eventsListPrefix,
      exact: false,
    });

    for (const [key, data] of allEventsQueries) {
      if (!data || !Array.isArray(data)) continue;
      if (Array.isArray(key) && key.length >= 4) {
        const keyParams = key[3] as
          | { calendarId?: string; timeMin?: string; timeMax?: string }
          | undefined;
        if (keyParams?.calendarId === calendarId) {
          const originalCount = data.length;
          const filteredEvents = filterEventsByTimeRange(data, timeMinDate, timeMaxDate);
          const eventsWithCalendarId = filteredEvents.map((event) => ({
            ...event,
            calendarId: event.calendarId || calendarId,
          }));
          aggregatedEvents.push(...eventsWithCalendarId);
          if (eventsWithCalendarId.length > 0) {
            log.debug(
              LOG_CATEGORIES.CALENDAR,
              "Retrieved Google Calendar events from cache (fallback match)",
              {
                calendarId,
                eventCount: eventsWithCalendarId.length,
                originalEventCount: originalCount,
                filtered: originalCount !== eventsWithCalendarId.length,
              }
            );
          }
          break;
        }
      }
    }
  }

  if (calendarIds.length > 0 && aggregatedEvents.length > 0) {
    log.debug(LOG_CATEGORIES.CALENDAR, "Aggregated Google Calendar events from cache", {
      calendarCount: calendarIds.length,
      totalEventCount: aggregatedEvents.length,
    });
  }
  return aggregatedEvents;
}

/**
 * Aggregate Google Calendar events from React Query cache.
 * If calendarIds is null, search all cached event queries (fallback when "primary" can't be resolved).
 * Otherwise read from cache for each calendar (exact match then fallback), filter by time range, attach calendarId.
 */
export function getAggregatedCachedEvents(
  queryClient: QueryClient,
  calendarIds: string[] | null,
  timeMin: string | undefined,
  timeMax: string | undefined,
  shouldLoadData: boolean
): GoogleEvent[] {
  if (!shouldLoadData) return [];

  const timeMinDate = timeMin ? dateParseISO(timeMin).toDate() : null;
  const timeMaxDate = timeMax ? dateParseISO(timeMax).toDate() : null;

  if (calendarIds === null) {
    return aggregateFromAllCalendars(queryClient, timeMinDate, timeMaxDate);
  }
  if (calendarIds.length === 0) return [];

  return aggregateFromCalendarIds(
    queryClient,
    calendarIds,
    timeMin,
    timeMax,
    timeMinDate,
    timeMaxDate
  );
}
