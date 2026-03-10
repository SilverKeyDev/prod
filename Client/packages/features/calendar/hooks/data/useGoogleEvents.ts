import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";

import type {
  GoogleCalendar,
  GoogleEvent,
  GoogleEventCreateResponse,
} from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { googleCalendarApi } from "packages/features/calendar/api";
import { showErrorToast } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";

import { getAggregatedCachedEvents } from "@/features/calendar/utils/aggregateCachedEvents";

import {
  aggregateFetchedEvents,
  buildEventsListQueryFn,
  getCalendarsWithoutCache,
  getFirstFetchError,
  resolveCalendarId as resolveCalendarIdPure,
  resolveCalendarIds,
} from "./useGoogleEventsHelpers";

export type UseGoogleEventsReturn = {
  events: GoogleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  refreshEvents: () => Promise<void>;
  createEvent: (event: GoogleEvent) => Promise<GoogleEventCreateResponse>;
  isCreatingEvent: boolean;
};

/** Merges cached + fetched events and drives loading/error state. */
function useGoogleEventsMerge(
  allCachedEvents: GoogleEvent[],
  fetchedEvents: GoogleEvent[],
  shouldLoadData: boolean,
  calendarIds: string[] | null,
  isFetching: boolean,
  fetchError: string | null
) {
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const previousEventsRef = useRef<GoogleEvent[]>([]);

  useEffect(() => {
    if (!shouldLoadData) {
      if (previousEventsRef.current.length > 0) {
        setEvents([]);
        previousEventsRef.current = [];
      }
      return;
    }
    const allEvents = [...allCachedEvents, ...fetchedEvents];
    const currentIds = allEvents
      .map((e) => e.id)
      .sort()
      .join(",");
    const prevIds = previousEventsRef.current
      .map((e) => e.id)
      .sort()
      .join(",");
    if (currentIds !== prevIds || allEvents.length !== previousEventsRef.current.length) {
      setEvents(allEvents);
      previousEventsRef.current = allEvents;
    }
  }, [shouldLoadData, allCachedEvents, fetchedEvents]);

  useEffect(() => {
    setEventsLoading(!!(shouldLoadData && calendarIds && calendarIds.length > 0 && isFetching));
  }, [shouldLoadData, calendarIds, isFetching]);

  useEffect(() => {
    setEventsError(fetchError);
  }, [fetchError]);

  const finalEvents = allCachedEvents.length > 0 ? allCachedEvents : events;
  return { events: finalEvents, eventsLoading, eventsError };
}

/** Core data + fetch + refresh; keep under 80 lines for max-lines-per-function. */
function useGoogleEventsCore(
  params: Parameters<typeof useGoogleEvents>[0],
  queryClient: ReturnType<typeof useQueryClient>,
  shouldLoadData: boolean
) {
  const cachedCalendars = useMemo(
    () =>
      shouldLoadData
        ? (queryClient.getQueryData<GoogleCalendar[]>(queryKeys.googleCalendar.calendars()) ?? [])
        : [],
    [shouldLoadData, queryClient]
  );

  const resolveCalendarId = useCallback(
    (calendarId: string): string | null => {
      const resolved = resolveCalendarIdPure(cachedCalendars, calendarId);
      if (calendarId === "primary" && !resolved && cachedCalendars.length > 0) {
        log.warn(
          LOG_CATEGORIES.CALENDAR,
          "Could not resolve 'primary' calendar ID - no primary calendar found in cache",
          {
            availableCalendars: cachedCalendars.map((cal) => ({
              id: cal.id,
              summary: cal.summary,
            })),
          }
        );
      }
      return resolved;
    },
    [cachedCalendars]
  );

  const calendarIds = useMemo(
    () => resolveCalendarIds(params ?? {}, resolveCalendarId),
    [params, resolveCalendarId]
  );

  const memoizedParams = useMemo(
    () => ({
      calendarIds,
      timeMin: params?.timeMin,
      timeMax: params?.timeMax,
    }),
    [calendarIds, params]
  );

  const allCachedEvents = useMemo(
    () =>
      getAggregatedCachedEvents(
        queryClient,
        calendarIds,
        memoizedParams.timeMin,
        memoizedParams.timeMax,
        shouldLoadData
      ),
    [shouldLoadData, calendarIds, memoizedParams.timeMin, memoizedParams.timeMax, queryClient]
  );

  const getCached = useCallback(
    (calendarId: string) =>
      queryClient.getQueryData<GoogleEvent[]>(
        queryKeys.googleCalendar.eventsList({
          calendarId,
          timeMin: memoizedParams.timeMin,
          timeMax: memoizedParams.timeMax,
        })
      ),
    [queryClient, memoizedParams.timeMin, memoizedParams.timeMax]
  );

  const calendarsToFetch = useMemo(
    () => getCalendarsWithoutCache(calendarIds, getCached),
    [calendarIds, getCached]
  );

  const needsFetching = calendarsToFetch.length > 0;
  const fetchResults = useQueries({
    queries: calendarsToFetch.map((calendarId) => ({
      queryKey: queryKeys.googleCalendar.eventsList({
        calendarId,
        timeMin: memoizedParams.timeMin,
        timeMax: memoizedParams.timeMax,
      }),
      queryFn: buildEventsListQueryFn(calendarId, memoizedParams.timeMin, memoizedParams.timeMax),
      enabled: shouldLoadData && needsFetching,
      staleTime: 2 * 60 * 1000,
    })),
  });

  const fetchedEvents = useMemo(() => aggregateFetchedEvents(fetchResults), [fetchResults]);
  const isFetching = useMemo(() => fetchResults.some((r) => r.isLoading), [fetchResults]);
  const fetchError = useMemo(() => getFirstFetchError(fetchResults), [fetchResults]);

  const { events, eventsLoading, eventsError } = useGoogleEventsMerge(
    allCachedEvents,
    fetchedEvents,
    shouldLoadData,
    calendarIds,
    isFetching,
    fetchError
  );

  const refreshEvents = useCallback(async () => {
    if (calendarIds?.length && memoizedParams.timeMin && memoizedParams.timeMax) {
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
      await queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.events(),
      });
    }
    log.debug(LOG_CATEGORIES.CALENDAR, "Refreshed Google Calendar events");
  }, [calendarIds, memoizedParams.timeMin, memoizedParams.timeMax, queryClient]);

  return { events, eventsLoading, eventsError, refreshEvents };
}

/**
 * Hook to read and fetch Google Calendar events (cache-first, then fetch).
 * Aggregates events from all requested calendars.
 */
export function useGoogleEvents(params?: {
  calendarId?: string;
  calendarIds?: string[];
  timeMin?: string;
  timeMax?: string;
  enabled?: boolean;
}): UseGoogleEventsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const shouldLoadData = useMemo(
    () => (params?.enabled ?? true) && authReady && isAuthenticated,
    [params?.enabled, authReady, isAuthenticated]
  );

  const core = useGoogleEventsCore(params, queryClient, shouldLoadData);

  const createEventMutation = useMutation({
    mutationFn: async (event: GoogleEvent) => {
      const response = await googleCalendarApi.createEvent(event);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to create event");
      }
      return response.data as GoogleEventCreateResponse;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.events(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.eventsList(),
      });
    },
    onError: (error) => {
      log.error(LOG_CATEGORIES.ERRORS, "Create calendar event failed", error);
      showErrorToast("Failed to create event. Please try again.");
    },
  });

  const createEvent = useCallback(
    async (event: GoogleEvent): Promise<GoogleEventCreateResponse> =>
      createEventMutation.mutateAsync(event) as Promise<GoogleEventCreateResponse>,
    [createEventMutation]
  );

  return {
    ...core,
    createEvent,
    isCreatingEvent: createEventMutation.isPending,
  };
}
