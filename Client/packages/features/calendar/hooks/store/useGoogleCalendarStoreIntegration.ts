import { useCallback, useMemo } from "react";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { googleCalendarApi } from "packages/features/calendar/api";
import { log } from "packages/logger";
import { useAuthStore, useGoogleCalendarStore } from "packages/store";
import { dateNow } from "packages/utils/date";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

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

  const {
    queryClient,
    isConnected,
    connectionStatusLoading,
    calendars,
    calendarsLoading,
    calendarsError,
  } = useGoogleCalendarConnectionState(shouldLoadData);

  const revokeMutation = useMutation({
    mutationFn: async () => {
      const response = await googleCalendarApi.revokeAccess();
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to revoke access"));
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
      "HOOKS",
      "refreshCalendars called but fetching is disabled - calendars only fetched via initial prefetch"
    );
  }, []);

  const connectGoogleCalendar = useCallback(() => {
    void googleCalendarApi.startOAuth();
  }, []);

  const disconnectGoogleCalendar = useCallback(async () => {
    await revokeMutation.mutateAsync();
  }, [revokeMutation]);

  // Anchor to start-of-today so multiple call sites of this hook (e.g.
  // DashboardFeature + UpcomingEvents + Calendar shell) share the same React
  // Query key. Previously each instance picked its own `now.toISOString()`,
  // which caused N parallel identical Google Calendar fetches and N separate
  // useSyncCalendarToStore loops writing to the same Zustand slice.
  const eventParams = useMemo(() => {
    const todayStart = dateNow().startOf("day");
    const sevenDaysFromNow = todayStart.add(7, "day");
    return {
      calendarId: "primary",
      timeMin: todayStart.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
    };
  }, []);

  const { events, eventsLoading, eventsError, refreshEvents, createEvent, isCreatingEvent } =
    useGoogleEvents({
      ...eventParams,
      enabled: isConnected,
    });

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
    connectionStatusLoading,
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
