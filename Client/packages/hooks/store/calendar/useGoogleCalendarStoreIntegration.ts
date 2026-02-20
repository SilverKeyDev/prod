import { useCallback, useMemo } from "react";

import { useMutation } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import { googleCalendarApi } from "packages/config/api/calendar/googleCalendar";
import { queryKeys } from "packages/config/query/keys";
import { useGoogleEvents } from "packages/hooks/data/calendar";
import { useGoogleCalendarStore } from "packages/store";
import { useAuthStore } from "packages/store";
import { dateNow } from "packages/utils/core/date";

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
  const shouldLoadData = useMemo(
    () => authReady && isAuthenticated,
    [authReady, isAuthenticated],
  );

  const {
    queryClient,
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
  } = useGoogleCalendarConnectionState(shouldLoadData);

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
      "refreshCalendars called but fetching is disabled - calendars only fetched via initial prefetch",
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

  const {
    events,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent,
  } = useGoogleEvents(eventParams);

  const storeSetters = useGoogleCalendarStore();
  useSyncCalendarToStore(
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    events,
    eventsLoading,
    eventsError,
    storeSetters,
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
