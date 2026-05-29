import { useEffect, useMemo, useRef } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { GoogleCalendar, GoogleEvent } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import type { GoogleCalendarState } from "packages/features/calendar/store";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

import { googleCalendarApi } from "@/features/calendar/api";
import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";

/** Avoids writing the Zustand slice when only the events array reference changed. */
function calendarEventsStoreSyncSignature(events: GoogleEvent[]): string {
  if (events.length === 0) {
    return "";
  }
  return events
    .map((e) => {
      const st = e.start?.dateTime ?? e.start?.date ?? "";
      const en = e.end?.dateTime ?? e.end?.date ?? "";
      return `${e.id ?? ""}\t${st}\t${en}`;
    })
    .join("\n");
}

export type GoogleCalendarStoreSyncSetters = Pick<
  GoogleCalendarState,
  | "setIsConnected"
  | "setCalendars"
  | "setCalendarsLoading"
  | "setCalendarsError"
  | "setEvents"
  | "setEventsLoading"
  | "setEventsError"
>;

function useCalendarCache(queryClient: ReturnType<typeof useQueryClient>, shouldLoadData: boolean) {
  const cachedConnectionStatus = useMemo(() => {
    if (!shouldLoadData) return false;
    return (
      queryClient.getQueryData<boolean>([...queryKeys.googleCalendar.all, "connection"]) ?? false
    );
  }, [shouldLoadData, queryClient]);

  const cachedSilverKeyCalendar = useMemo(() => {
    if (!shouldLoadData) return null;
    return (
      queryClient.getQueryData<GoogleCalendar>(queryKeys.scheduling.silverKeyCalendar()) ?? null
    );
  }, [shouldLoadData, queryClient]);

  return { cachedConnectionStatus, cachedSilverKeyCalendar };
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

  const { cachedConnectionStatus, cachedSilverKeyCalendar } = useCalendarCache(
    queryClient,
    shouldLoadData
  );

  const isConnected = connectionStatusQuery.data ?? cachedConnectionStatus ?? false;

  /** True until the first connection check resolves (avoids flashing "Connect Google Calendar"). */
  const connectionStatusLoading =
    shouldLoadData && connectionStatusQuery.data === undefined && connectionStatusQuery.isPending;

  const silverKeyQuery = useQuery({
    queryKey: queryKeys.scheduling.silverKeyCalendar(),
    queryFn: async () => {
      const response = await googleCalendarApi.getOrCreateSilverKeyCalendar(undefined);
      if (!response.success || !response.data) {
        throw new Error(
          resolveApiResultErrorMessage(response, "Failed to load SilverKey calendar")
        );
      }
      return response.data;
    },
    enabled: shouldLoadData && isConnected,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const calendars = useMemo((): GoogleCalendar[] => {
    const cal = silverKeyQuery.data ?? cachedSilverKeyCalendar;
    return cal ? [cal] : [];
  }, [silverKeyQuery.data, cachedSilverKeyCalendar]);
  const calendarsLoading = silverKeyQuery.isLoading;
  const calendarsError = silverKeyQuery.error
    ? silverKeyQuery.error instanceof Error
      ? silverKeyQuery.error.message
      : "Failed to load SilverKey calendar"
    : null;

  return {
    queryClient,
    isConnected,
    connectionStatusLoading,
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
  setters: GoogleCalendarStoreSyncSetters
) {
  const lastIsConnectedRef = useRef<typeof isConnected>();
  const lastCalendarsRef = useRef<typeof calendars>();
  const lastCalendarsLoadingRef = useRef<typeof calendarsLoading>();
  const lastCalendarsErrorRef = useRef<typeof calendarsError>();
  const lastEventsSignatureRef = useRef<string>();
  const lastEventsLoadingRef = useRef<typeof eventsLoading>();
  const lastEventsErrorRef = useRef<typeof eventsError>();

  useEffect(() => {
    if (lastIsConnectedRef.current !== isConnected) {
      lastIsConnectedRef.current = isConnected;
      setters.setIsConnected(isConnected);
    }
    if (lastCalendarsRef.current !== calendars) {
      lastCalendarsRef.current = calendars;
      setters.setCalendars(calendars);
    }
    if (lastCalendarsLoadingRef.current !== calendarsLoading) {
      lastCalendarsLoadingRef.current = calendarsLoading;
      setters.setCalendarsLoading(calendarsLoading);
    }
    if (lastCalendarsErrorRef.current !== calendarsError) {
      lastCalendarsErrorRef.current = calendarsError;
      setters.setCalendarsError(calendarsError);
    }
    const nextEventsSig = calendarEventsStoreSyncSignature(events);
    if (lastEventsSignatureRef.current !== nextEventsSig) {
      lastEventsSignatureRef.current = nextEventsSig;
      setters.setEvents(events);
    }
    if (lastEventsLoadingRef.current !== eventsLoading) {
      lastEventsLoadingRef.current = eventsLoading;
      setters.setEventsLoading(eventsLoading);
    }
    if (lastEventsErrorRef.current !== eventsError) {
      lastEventsErrorRef.current = eventsError;
      setters.setEventsError(eventsError);
    }
  }, [
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events,
    eventsLoading,
    eventsError,
    setters,
  ]);
}
