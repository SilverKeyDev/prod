import { useEffect, useMemo, useRef } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { GoogleCalendar } from "packages/config/api";
import { queryKeys } from "packages/config/query/keys";
import { useGoogleCalendarStore } from "packages/store";
import { getDocument, getWindow } from "packages/utils/platform";

import { googleCalendarApi } from "@/features/calendar/api";
import { useGoogleEvents } from "@/features/calendar/hooks/data";

function useCalendarCache(queryClient: ReturnType<typeof useQueryClient>, shouldLoadData: boolean) {
  const cachedConnectionStatus = useMemo(() => {
    if (!shouldLoadData) return false;
    return (
      queryClient.getQueryData<boolean>([...queryKeys.googleCalendar.all, "connection"]) ?? false
    );
  }, [shouldLoadData, queryClient]);

  const cachedCalendars = useMemo(() => {
    if (!shouldLoadData) return [];
    return queryClient.getQueryData<GoogleCalendar[]>(queryKeys.googleCalendar.calendars()) ?? [];
  }, [shouldLoadData, queryClient]);

  return { cachedConnectionStatus, cachedCalendars };
}

export function useGoogleCalendarConnectionState(shouldLoadData: boolean) {
  const queryClient = useQueryClient();

  const connectionStatusQuery = useQuery({
    queryKey: [...queryKeys.googleCalendar.all, "connection"],
    queryFn: () => googleCalendarApi.isConnected(),
    enabled: shouldLoadData,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { cachedConnectionStatus, cachedCalendars } = useCalendarCache(queryClient, shouldLoadData);

  const isConnected = connectionStatusQuery.data ?? cachedConnectionStatus ?? false;

  const calendarsQuery = useQuery({
    queryKey: queryKeys.googleCalendar.calendars(),
    queryFn: async () => {
      const response = await googleCalendarApi.listCalendars();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch calendars");
      }
      return response.data?.items ?? [];
    },
    enabled: shouldLoadData && isConnected,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const calendars = useMemo(
    () => calendarsQuery.data ?? cachedCalendars ?? [],
    [calendarsQuery.data, cachedCalendars]
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
  store: ReturnType<typeof useGoogleCalendarStore>
) {
  const lastIsConnectedRef = useRef<typeof isConnected>();
  const lastCalendarsRef = useRef<typeof calendars>();
  const lastCalendarsLoadingRef = useRef<typeof calendarsLoading>();
  const lastCalendarsErrorRef = useRef<typeof calendarsError>();
  const lastEventsRef = useRef<typeof events>();
  const lastEventsLoadingRef = useRef<typeof eventsLoading>();
  const lastEventsErrorRef = useRef<typeof eventsError>();
  const storeRef = useRef(store);
  storeRef.current = store;

  useEffect(() => {
    const s = storeRef.current;
    if (lastIsConnectedRef.current !== isConnected) {
      lastIsConnectedRef.current = isConnected;
      s.setIsConnected(isConnected);
    }
    if (lastCalendarsRef.current !== calendars) {
      lastCalendarsRef.current = calendars;
      s.setCalendars(calendars);
    }
    if (lastCalendarsLoadingRef.current !== calendarsLoading) {
      lastCalendarsLoadingRef.current = calendarsLoading;
      s.setCalendarsLoading(calendarsLoading);
    }
    if (lastCalendarsErrorRef.current !== calendarsError) {
      lastCalendarsErrorRef.current = calendarsError;
      s.setCalendarsError(calendarsError);
    }
    if (lastEventsRef.current !== events) {
      lastEventsRef.current = events;
      s.setEvents(events);
    }
    if (lastEventsLoadingRef.current !== eventsLoading) {
      lastEventsLoadingRef.current = eventsLoading;
      s.setEventsLoading(eventsLoading);
    }
    if (lastEventsErrorRef.current !== eventsError) {
      lastEventsErrorRef.current = eventsError;
      s.setEventsError(eventsError);
    }
    // store omitted from deps intentionally: it's the hook return value and changes when
    // state updates, which would re-run this effect and cause an infinite loop.
  }, [
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events,
    eventsLoading,
    eventsError,
  ]);
}
