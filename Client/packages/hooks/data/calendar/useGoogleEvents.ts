import { useMutation, useQueryClient, useQueries } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";

import { queryKeys } from "../../../config/query/keys";
import { useAuthStore } from "../../../store/auth.slice";
import { googleCalendarApi } from "../../../config/api/calendar/googleCalendar";
import { log, LOG_CATEGORIES } from "../../../../logger";
import type {
  GoogleEvent,
  GoogleEventCreateResponse,
  GoogleCalendar,
} from "../../../config/api";

export type UseGoogleEventsReturn = {
  events: GoogleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  refreshEvents: () => Promise<void>;
  createEvent: (event: GoogleEvent) => Promise<GoogleEventCreateResponse>;
  isCreatingEvent: boolean;
};

/**
 * Hook to read and fetch Google Calendar events
 *
 * This hook:
 * 1. First tries to read from React Query cache (for instant display)
 * 2. If data is not in cache, fetches it from the API
 * 3. Aggregates events from all requested calendars
 *
 * Events appear immediately from cache when available, and are fetched when navigating to months not in cache.
 *
 * @param params - Optional parameters to filter events
 * @param params.calendarId - Single calendar ID to read events from (for backward compatibility)
 * @param params.calendarIds - Array of calendar IDs to read events from (aggregates events from all)
 * @param params.timeMin - Start time in ISO 8601 format
 * @param params.timeMax - End time in ISO 8601 format
 * @param params.enabled - Whether the query should run (default: true)
 * @returns Events, loading state, error state, and mutation functions
 */
export function useGoogleEvents(params?: {
  calendarId?: string;
  calendarIds?: string[];
  timeMin?: string;
  timeMax?: string;
  enabled?: boolean;
}): UseGoogleEventsReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Check cache first to show data immediately
  const shouldLoadData = useMemo(() => {
    return (params?.enabled ?? true) && authReady && isAuthenticated;
  }, [params?.enabled, authReady, isAuthenticated]);

  // Get cached calendars to resolve "primary" to actual calendar ID
  const cachedCalendars = useMemo(() => {
    if (!shouldLoadData) return [];
    return (
      queryClient.getQueryData<GoogleCalendar[]>(
        queryKeys.googleCalendar.calendars(),
      ) ?? []
    );
  }, [shouldLoadData, queryClient]);

  // Resolve "primary" to actual calendar ID
  // Returns null if "primary" can't be resolved (calendars not loaded yet)
  const resolveCalendarId = useCallback(
    (calendarId: string): string | null => {
      if (calendarId === "primary") {
        // Find the primary calendar from cached calendars
        const primaryCalendar = cachedCalendars.find(
          (cal) => cal.primary === true,
        );
        if (primaryCalendar) {
          // Only log once per resolution to avoid excessive logging
          // The resolution is memoized, so this should only log when calendars change
          return primaryCalendar.id;
        }
        // If no primary calendar found, return null to indicate we should search all calendars
        // Only log warning if calendars are loaded but no primary found (unexpected case)
        if (cachedCalendars.length > 0) {
          log.warn(
            LOG_CATEGORIES.CALENDAR,
            "Could not resolve 'primary' calendar ID - no primary calendar found in cache",
            {
              availableCalendars: cachedCalendars.map((cal) => ({
                id: cal.id,
                summary: cal.summary,
              })),
            },
          );
        }
        return null; // Signal to search all calendars
      }
      return calendarId;
    },
    [cachedCalendars],
  );

  // Determine which calendar IDs to use
  // Support both calendarId (single, for backward compatibility) and calendarIds (array)
  // Resolve "primary" to actual calendar ID
  // If "primary" can't be resolved (calendars not loaded), use null to signal searching all calendars
  const calendarIds = useMemo(() => {
    if (params?.calendarIds && params.calendarIds.length > 0) {
      const resolved = params.calendarIds
        .map(resolveCalendarId)
        .filter((id): id is string => id !== null);
      return resolved.length > 0 ? resolved : null; // null means search all calendars
    }
    if (params?.calendarId) {
      const resolved = resolveCalendarId(params.calendarId);
      return resolved !== null ? [resolved] : null; // null means search all calendars
    }
    return [];
  }, [params?.calendarId, params?.calendarIds, resolveCalendarId]);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(
    () => ({
      calendarIds,
      timeMin: params?.timeMin,
      timeMax: params?.timeMax,
      enabled: params?.enabled ?? true,
    }),
    [calendarIds, params?.timeMin, params?.timeMax, params?.enabled],
  );

  // Aggregate events from all requested calendars
  // Read from cache for each calendar and combine them
  // If calendarIds is null, search all cached events (fallback when "primary" can't be resolved)
  const allCachedEvents = useMemo(() => {
    if (!shouldLoadData) {
      return [];
    }

    // If calendarIds is null, it means we should search all cached events
    // This happens when "primary" is requested but calendars aren't loaded yet
    if (calendarIds === null) {
      // Only log this once to avoid excessive logging - this is expected during initial load

      const aggregatedEvents: GoogleEvent[] = [];
      const timeMin = memoizedParams.timeMin
        ? new Date(memoizedParams.timeMin)
        : null;
      const timeMax = memoizedParams.timeMax
        ? new Date(memoizedParams.timeMax)
        : null;

      // Search all cached event queries
      const eventsListPrefix = queryKeys.googleCalendar.events();
      const allEventsQueries = queryClient.getQueriesData<GoogleEvent[]>({
        queryKey: eventsListPrefix,
        exact: false,
      });

      for (const [_key, data] of allEventsQueries) {
        if (!data || !Array.isArray(data)) continue;

        // Filter events by the requested time range if needed
        let filteredEvents = data;

        if (timeMin && timeMax && data.length > 0) {
          filteredEvents = data.filter((event) => {
            const eventStart = event.start?.dateTime
              ? new Date(event.start.dateTime)
              : event.start?.date
                ? new Date(event.start.date)
                : null;

            if (!eventStart) return false;

            // Include events that overlap with the requested time range
            const eventEnd = event.end?.dateTime
              ? new Date(event.end.dateTime)
              : event.end?.date
                ? new Date(event.end.date)
                : eventStart;

            return eventStart <= timeMax && eventEnd >= timeMin;
          });
        }

        aggregatedEvents.push(...filteredEvents);
      }

      // Only log if there are events (reduce noise)
      if (aggregatedEvents.length > 0) {
        log.debug(
          LOG_CATEGORIES.CALENDAR,
          "Aggregated Google Calendar events from all cached calendars",
          {
            totalEventCount: aggregatedEvents.length,
          },
        );
      }

      return aggregatedEvents;
    }

    if (calendarIds.length === 0) {
      return [];
    }

    const aggregatedEvents: GoogleEvent[] = [];
    const timeMin = memoizedParams.timeMin
      ? new Date(memoizedParams.timeMin)
      : null;
    const timeMax = memoizedParams.timeMax
      ? new Date(memoizedParams.timeMax)
      : null;

    // Read from cache for each calendar
    for (const calendarId of calendarIds) {
      const queryKey = queryKeys.googleCalendar.eventsList({
        calendarId,
        timeMin: memoizedParams.timeMin,
        timeMax: memoizedParams.timeMax,
      });

      // Try exact match first
      const cachedEvents = queryClient.getQueryData<GoogleEvent[]>(queryKey);

      if (cachedEvents && Array.isArray(cachedEvents)) {
        // Add events with calendarId if not already set
        const eventsWithCalendarId = cachedEvents.map((event) => ({
          ...event,
          calendarId: event.calendarId || calendarId,
        }));
        aggregatedEvents.push(...eventsWithCalendarId);

        // Log exact cache match (only for non-empty results to reduce noise)
        if (eventsWithCalendarId.length > 0) {
          log.debug(
            LOG_CATEGORIES.CALENDAR,
            "Retrieved Google Calendar events from cache (exact match)",
            {
              calendarId,
              eventCount: eventsWithCalendarId.length,
            },
          );
        }
        continue;
      }

      // If exact match not found, try to find prefetched events for this calendar
      // The prefetch might have used a different timeMin/timeMax, so we search
      // for any events query for this calendar and filter by time range
      const eventsListPrefix = queryKeys.googleCalendar.events();
      const allEventsQueries = queryClient.getQueriesData<GoogleEvent[]>({
        queryKey: eventsListPrefix,
        exact: false,
      });

      // Find prefetched data for this calendar
      let foundFallback = false;
      for (const [key, data] of allEventsQueries) {
        if (!data || !Array.isArray(data)) continue;

        // Extract calendarId from the query key
        // Query key structure: ["googleCalendar", "events", "list", { calendarId: "...", ... }]
        if (Array.isArray(key) && key.length >= 4) {
          const keyParams = key[3] as
            | { calendarId?: string; timeMin?: string; timeMax?: string }
            | undefined;
          if (keyParams?.calendarId === calendarId) {
            // Found prefetched data for this calendar
            // Filter events by the requested time range if needed
            let filteredEvents = data;
            const originalCount = data.length;

            if (timeMin && timeMax && data.length > 0) {
              filteredEvents = data.filter((event) => {
                const eventStart = event.start?.dateTime
                  ? new Date(event.start.dateTime)
                  : event.start?.date
                    ? new Date(event.start.date)
                    : null;

                if (!eventStart) return false;

                // Include events that overlap with the requested time range
                const eventEnd = event.end?.dateTime
                  ? new Date(event.end.dateTime)
                  : event.end?.date
                    ? new Date(event.end.date)
                    : eventStart;

                return eventStart <= timeMax && eventEnd >= timeMin;
              });
            }

            // Add events with calendarId if not already set
            const eventsWithCalendarId = filteredEvents.map((event) => ({
              ...event,
              calendarId: event.calendarId || calendarId,
            }));
            aggregatedEvents.push(...eventsWithCalendarId);

            // Log fallback cache match (only for non-empty results to reduce noise)
            if (eventsWithCalendarId.length > 0) {
              log.debug(
                LOG_CATEGORIES.CALENDAR,
                "Retrieved Google Calendar events from cache (fallback match)",
                {
                  calendarId,
                  eventCount: eventsWithCalendarId.length,
                  originalEventCount: originalCount,
                  filtered: originalCount !== eventsWithCalendarId.length,
                },
              );
            }

            foundFallback = true;
            break; // Found matching calendar, stop searching
          }
        }
      }

      // Don't log "no cache found" - this is expected when navigating to new date ranges
    }

    // Only log aggregated results if there are events (reduce noise)
    if (
      shouldLoadData &&
      calendarIds !== null &&
      calendarIds.length > 0 &&
      aggregatedEvents.length > 0
    ) {
      log.debug(
        LOG_CATEGORIES.CALENDAR,
        "Aggregated Google Calendar events from cache",
        {
          calendarCount: calendarIds.length,
          totalEventCount: aggregatedEvents.length,
        },
      );
    }

    return aggregatedEvents;
  }, [
    shouldLoadData,
    calendarIds,
    memoizedParams.timeMin,
    memoizedParams.timeMax,
    queryClient,
  ]);

  // Check if we need to fetch data (not in cache)
  const needsFetching = useMemo(() => {
    if (!shouldLoadData || calendarIds === null || calendarIds.length === 0) {
      return false;
    }

    // Check if we have cached data for all requested calendars
    for (const calendarId of calendarIds) {
      const queryKey = queryKeys.googleCalendar.eventsList({
        calendarId,
        timeMin: memoizedParams.timeMin,
        timeMax: memoizedParams.timeMax,
      });
      const cached = queryClient.getQueryData<GoogleEvent[]>(queryKey);

      // If any calendar doesn't have cached data, we need to fetch
      if (cached === undefined) {
        return true;
      }
    }

    return false;
  }, [
    shouldLoadData,
    calendarIds,
    memoizedParams.timeMin,
    memoizedParams.timeMax,
    queryClient,
  ]);

  // Determine which calendars need fetching
  const calendarsToFetch = useMemo(() => {
    if (!needsFetching || calendarIds === null || calendarIds.length === 0) {
      return [];
    }

    return calendarIds.filter((calendarId) => {
      const queryKey = queryKeys.googleCalendar.eventsList({
        calendarId,
        timeMin: memoizedParams.timeMin,
        timeMax: memoizedParams.timeMax,
      });
      const cached = queryClient.getQueryData<GoogleEvent[]>(queryKey);
      return cached === undefined;
    });
  }, [
    needsFetching,
    calendarIds,
    memoizedParams.timeMin,
    memoizedParams.timeMax,
    queryClient,
  ]);

  // Use React Query to fetch events for calendars not in cache
  const fetchResults = useQueries({
    queries: calendarsToFetch.map((calendarId) => {
      const queryKey = queryKeys.googleCalendar.eventsList({
        calendarId,
        timeMin: memoizedParams.timeMin,
        timeMax: memoizedParams.timeMax,
      });

      return {
        queryKey,
        queryFn: async () => {
          log.debug(
            LOG_CATEGORIES.CALENDAR,
            "Fetching Google Calendar events (not in cache)",
            {
              calendarId,
            },
          );

          const response = await googleCalendarApi.listEvents({
            calendarId,
            timeMin: memoizedParams.timeMin,
            timeMax: memoizedParams.timeMax,
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
        },
        enabled: shouldLoadData && needsFetching,
        staleTime: 2 * 60 * 1000, // 2 minutes
      };
    }),
  });

  // Aggregate fetched events
  const fetchedEvents = useMemo(() => {
    const allFetched: GoogleEvent[] = [];
    for (const result of fetchResults) {
      if (result.data && Array.isArray(result.data)) {
        allFetched.push(...result.data);
      }
    }
    return allFetched;
  }, [fetchResults]);

  // Check if any fetch is loading
  const isFetching = useMemo(() => {
    return fetchResults.some((result) => result.isLoading);
  }, [fetchResults]);

  // Check if any fetch has error
  const fetchError = useMemo(() => {
    for (const result of fetchResults) {
      if (result.error) {
        return result.error instanceof Error
          ? result.error.message
          : String(result.error);
      }
    }
    return null;
  }, [fetchResults]);

  // Initialize events from cache immediately
  // Use ref to track previous events to prevent infinite loops
  const previousEventsRef = useRef<GoogleEvent[]>([]);

  useEffect(() => {
    if (!shouldLoadData) {
      // Only set empty if we actually have events (avoid unnecessary updates)
      if (previousEventsRef.current.length > 0) {
        setEvents([]);
        previousEventsRef.current = [];
      }
      return;
    }

    // Combine cached and fetched events
    const allEvents = [...allCachedEvents, ...fetchedEvents];

    // Compare events by IDs to avoid unnecessary state updates
    const currentEventIds = allEvents
      .map((e) => e.id)
      .sort()
      .join(",");
    const previousEventIds = previousEventsRef.current
      .map((e) => e.id)
      .sort()
      .join(",");

    // Only update if events have actually changed
    if (
      currentEventIds !== previousEventIds ||
      allEvents.length !== previousEventsRef.current.length
    ) {
      setEvents(allEvents);
      previousEventsRef.current = allEvents;
    }
  }, [shouldLoadData, allCachedEvents, fetchedEvents]);

  // Determine loading state
  useEffect(() => {
    if (!shouldLoadData || calendarIds === null || calendarIds.length === 0) {
      setEventsLoading(false);
      return;
    }

    // We're loading if we're fetching data
    setEventsLoading(isFetching);
  }, [shouldLoadData, calendarIds, isFetching]);

  // Set error state
  useEffect(() => {
    setEventsError(fetchError);
  }, [fetchError]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (event: GoogleEvent) => {
      const response = await googleCalendarApi.createEvent(event);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to create event");
      }
      return response.data as GoogleEventCreateResponse;
    },
    onSuccess: () => {
      // Invalidate events queries to refetch
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.events(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.eventsList(),
      });
    },
  });

  const refreshEvents = useCallback(async () => {
    // Invalidate and refetch all event queries
    if (
      calendarIds &&
      calendarIds.length > 0 &&
      memoizedParams.timeMin &&
      memoizedParams.timeMax
    ) {
      for (const calendarId of calendarIds) {
        const queryKey = queryKeys.googleCalendar.eventsList({
          calendarId,
          timeMin: memoizedParams.timeMin,
          timeMax: memoizedParams.timeMax,
        });
        await queryClient.invalidateQueries({ queryKey });
        await queryClient.refetchQueries({ queryKey });
      }
    } else {
      // Invalidate all event queries if params are not available
      await queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.events(),
      });
    }
    log.debug(LOG_CATEGORIES.CALENDAR, "Refreshed Google Calendar events");
  }, [
    calendarIds,
    memoizedParams.timeMin,
    memoizedParams.timeMax,
    queryClient,
  ]);

  const createEvent = useCallback(
    async (event: GoogleEvent): Promise<GoogleEventCreateResponse> => {
      return (await createEventMutation.mutateAsync(
        event,
      )) as GoogleEventCreateResponse;
    },
    [createEventMutation],
  );

  // Return aggregated events from cache
  const finalEvents = useMemo((): GoogleEvent[] => {
    return allCachedEvents.length > 0 ? allCachedEvents : events;
  }, [allCachedEvents, events]);

  return {
    events: finalEvents,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent: createEventMutation.isPending,
  };
}
