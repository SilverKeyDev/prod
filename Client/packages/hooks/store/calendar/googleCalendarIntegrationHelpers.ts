import { useEffect, useMemo, useRef } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { GoogleCalendar } from "packages/config/api";
import { queryKeys } from "packages/config/query/keys";
import { useGoogleEvents } from "packages/hooks/data/calendar";
import { useGoogleCalendarStore } from "packages/store";
import { getDocument, getWindow } from "packages/utils/core/platform";

function useCalendarCache(
  queryClient: ReturnType<typeof useQueryClient>,
  shouldLoadData: boolean,
) {
  const cachedConnectionStatus = useMemo(() => {
    if (!shouldLoadData) return false;
    return (
      queryClient.getQueryData<boolean>([
        ...queryKeys.googleCalendar.all,
        "connection",
      ]) ?? false
    );
  }, [shouldLoadData, queryClient]);

  const cachedCalendars = useMemo(() => {
    if (!shouldLoadData) return [];
    return (
      queryClient.getQueryData<GoogleCalendar[]>(
        queryKeys.googleCalendar.calendars(),
      ) ?? []
    );
  }, [shouldLoadData, queryClient]);

  return { cachedConnectionStatus, cachedCalendars };
}

export function useGoogleCalendarConnectionState(shouldLoadData: boolean) {
  const queryClient = useQueryClient();

  const connectionStatusQuery = useQuery({
    queryKey: [...queryKeys.googleCalendar.all, "connection"],
    queryFn: async () => {
      throw new Error(
        "Connection status fetching is disabled - use cache only",
      );
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const calendarsQuery = useQuery({
    queryKey: queryKeys.googleCalendar.calendars(),
    queryFn: async () => {
      throw new Error("Calendars fetching is disabled - use cache only");
    },
    enabled: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { cachedConnectionStatus, cachedCalendars } = useCalendarCache(
    queryClient,
    shouldLoadData,
  );

  const isConnected =
    connectionStatusQuery.data ?? cachedConnectionStatus ?? false;
  const calendars = useMemo(
    () => calendarsQuery.data ?? cachedCalendars ?? [],
    [calendarsQuery.data, cachedCalendars],
  );
  const calendarsLoading = calendarsQuery.isLoading;
  const calendarsError = calendarsQuery.error
    ? calendarsQuery.error instanceof Error
      ? calendarsQuery.error.message
      : "Failed to fetch calendars"
    : null;

  useEffect(() => {
    const win = getWindow();
    const doc = getDocument();
    if (!win) return;
    const urlParams = new URLSearchParams(win.location.search);
    if (urlParams.get("google") === "connected") {
      win.history.replaceState({}, doc?.title ?? "", win.location.pathname);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.all,
      });
    }
  }, [queryClient]);

  return {
    queryClient,
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
  };
}

export function useSyncCalendarToStore(
  isConnected: boolean,
  calendars: GoogleCalendar[],
  calendarsLoading: boolean,
  calendarsError: string | null,
  events: ReturnType<typeof useGoogleEvents>["events"],
  eventsLoading: boolean,
  eventsError: string | null,
  store: ReturnType<typeof useGoogleCalendarStore>,
) {
  const lastIsConnectedRef = useRef<typeof isConnected>();
  const lastCalendarsRef = useRef<typeof calendars>();
  const lastCalendarsLoadingRef = useRef<typeof calendarsLoading>();
  const lastCalendarsErrorRef = useRef<typeof calendarsError>();
  const lastEventsRef = useRef<typeof events>();
  const lastEventsLoadingRef = useRef<typeof eventsLoading>();
  const lastEventsErrorRef = useRef<typeof eventsError>();

  useEffect(() => {
    if (lastIsConnectedRef.current !== isConnected) {
      lastIsConnectedRef.current = isConnected;
      store.setIsConnected(isConnected);
    }
    if (lastCalendarsRef.current !== calendars) {
      lastCalendarsRef.current = calendars;
      store.setCalendars(calendars);
    }
    if (lastCalendarsLoadingRef.current !== calendarsLoading) {
      lastCalendarsLoadingRef.current = calendarsLoading;
      store.setCalendarsLoading(calendarsLoading);
    }
    if (lastCalendarsErrorRef.current !== calendarsError) {
      lastCalendarsErrorRef.current = calendarsError;
      store.setCalendarsError(calendarsError);
    }
    if (lastEventsRef.current !== events) {
      lastEventsRef.current = events;
      store.setEvents(events);
    }
    if (lastEventsLoadingRef.current !== eventsLoading) {
      lastEventsLoadingRef.current = eventsLoading;
      store.setEventsLoading(eventsLoading);
    }
    if (lastEventsErrorRef.current !== eventsError) {
      lastEventsErrorRef.current = eventsError;
      store.setEventsError(eventsError);
    }
  }, [
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events,
    eventsLoading,
    eventsError,
    store,
  ]);
}
