import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { log } from "packages/logger";
import type { RouteConfig } from "packages/services/data/dataConfig";
import type { GoogleCalendar, UserProfile } from "packages/types";

export async function prefetchGoogleCalendarEventsRoute(
  routeConfig: RouteConfig,
  userProfile: UserProfile | null,
  queryClient: QueryClient
): Promise<void> {
  log.debug("CALENDAR", "Prefetching google events (primary + SilverKey metadata)");

  const prefetchResult = await routeConfig.queryFn(userProfile);

  if (!prefetchResult || Array.isArray(prefetchResult)) {
    log.debug("CALENDAR", "No google events to prefetch (user not connected or no data)");
    return;
  }

  if (
    typeof prefetchResult !== "object" ||
    !("events" in prefetchResult) ||
    !Array.isArray(prefetchResult.events)
  ) {
    log.debug("CALENDAR", "Invalid prefetch result structure");
    return;
  }

  const typedResult = prefetchResult as {
    silverKeyCalendar: GoogleCalendar | null;
    events: Array<{
      calendarId: string;
      events: unknown[];
      timeMin: string;
      timeMax: string;
    }>;
  };

  if (typedResult.silverKeyCalendar) {
    queryClient.setQueryData(
      queryKeys.scheduling.silverKeyCalendar(),
      typedResult.silverKeyCalendar
    );
    log.info("CALENDAR", "Stored SilverKey calendar in cache", {
      calendarId: typedResult.silverKeyCalendar.id,
    });
  }

  typedResult.events.forEach((result) => {
    const queryKey = queryKeys.googleCalendar.eventsList({
      calendarId: result.calendarId,
      timeMin: result.timeMin,
      timeMax: result.timeMax,
    });

    const events = result.events as Array<{ calendarId?: string }>;
    const eventsWithCalendarId = events.map((event) => ({
      ...event,
      calendarId: event.calendarId || result.calendarId,
    }));

    queryClient.setQueryData(queryKey, eventsWithCalendarId);

    if (eventsWithCalendarId.length > 0) {
      log.debug("CALENDAR", "Stored Google Calendar events in cache", {
        calendarId: result.calendarId,
        eventCount: eventsWithCalendarId.length,
      });
    }
  });

  log.info("CALENDAR", "Successfully prefetched google events", {
    batchCount: typedResult.events.length,
    totalEvents: typedResult.events.reduce((sum, r) => sum + r.events.length, 0),
  });
}
