import { useCallback, useMemo } from "react";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { googleCalendarApi } from "packages/features/calendar/api";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore, useGoogleCalendarStore } from "packages/store";
import { dateNow } from "packages/utils/date";

import { useGoogleEvents } from "@/features/calendar/hooks/data/google/useGoogleEvents";

import {
  useGoogleCalendarConnectionState,
  useSyncCalendarToStore,
} from "./googleCalendarIntegrationHelpers";

/**
 * Hook that integrates Google Calendar data from React Query cache with useGoogleCalendarStore
 */
export function useGoogleCalendarStoreIntegration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  const { queryClient, isConnected, calendars, calendarsLoading, calendarsError } =
    useGoogleCalendarConnectionState(shouldLoadData);

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const response = await googleCalendarApi.revokeAccess();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to revoke access");
      }
      googleCalendarApi.clearConnectionStatus();
    },
    onSuccess: () => {
      void queryClient.removeQueries({
        queryKey: queryKeys.googleCalendar.all,
      });
    },
  });

  const refreshCalendars = useCallback(async () => {
    log.debug(
      LOG_CATEGORIES.HOOKS,
      "refreshCalendars called but fetching is disabled - calendars only fetched via initial prefetch"
    );
  }, []);

  const connectGoogleCalendar = useCallback(() => {
    void googleCalendarApi.startOAuth();
  }, []);

  const disconnectGoogleCalendar = useCallback(async () => {
    await revokeMutation.mutateAsync();
  }, [revokeMutation]);

  const eventParams = useMemo(() => {
    const now = dateNow();
    const sevenDaysFromNow = now.add(7, "day");
    return {
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
    };
  }, []);

  const { events, eventsLoading, eventsError, refreshEvents, createEvent, isCreatingEvent } =
    useGoogleEvents(eventParams);

  const setIsConnected = useGoogleCalendarStore((s) => s.setIsConnected);
  const setCalendars = useGoogleCalendarStore((s) => s.setCalendars);
  const setCalendarsLoading = useGoogleCalendarStore((s) => s.setCalendarsLoading);
  const setCalendarsError = useGoogleCalendarStore((s) => s.setCalendarsError);
  const setEvents = useGoogleCalendarStore((s) => s.setEvents);
  const setEventsLoading = useGoogleCalendarStore((s) => s.setEventsLoading);
  const setEventsError = useGoogleCalendarStore((s) => s.setEventsError);

  const calendarStoreSyncSetters = useMemo(
    () => ({
      setIsConnected,
      setCalendars,
      setCalendarsLoading,
      setCalendarsError,
      setEvents,
      setEventsLoading,
      setEventsError,
    }),
    [
      setIsConnected,
      setCalendars,
      setCalendarsLoading,
      setCalendarsError,
      setEvents,
      setEventsLoading,
      setEventsError,
    ]
  );

  useSyncCalendarToStore(
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events,
    eventsLoading,
    eventsError,
    calendarStoreSyncSetters
  );

  return {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    refreshCalendars,
    events,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  };
}
