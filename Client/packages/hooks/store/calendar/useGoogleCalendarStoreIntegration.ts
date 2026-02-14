import { useEffect, useRef, useMemo, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";

import { useGoogleCalendarStore } from "../../../store/googleCalendar.slice";
import { useGoogleEvents } from "../../data/calendar";
import { queryKeys } from "../../../config/query/keys";
import { googleCalendarApi } from "../../../config/api/calendar/googleCalendar";
import { useAuthStore } from "../../../store/auth.slice";
import type { GoogleCalendar } from "../../../config/api";
import { log, LOG_CATEGORIES } from "../../../../logger";

/**
 * Hook that integrates Google Calendar data from React Query cache with useGoogleCalendarStore
 * This follows the same pattern as useSavedHomesStoreIntegration and useReportsStoreIntegration
 */
export function useGoogleCalendarStoreIntegration() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const queryClient = useQueryClient();

  const shouldLoadData = useMemo(() => {
    return authReady && isAuthenticated;
  }, [authReady, isAuthenticated]);

  // Read connection status from React Query cache (prefetched in dataConfig.ts)
  const connectionStatusQuery = useQuery({
    queryKey: [...queryKeys.googleCalendar.all, "connection"],
    queryFn: async () => {
      throw new Error(
        "Connection status fetching is disabled - use cache only",
      );
    },
    enabled: false, // Always disabled - only read from cache
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Read calendars from React Query cache (prefetched in dataConfig.ts)
  const calendarsQuery = useQuery({
    queryKey: queryKeys.googleCalendar.calendars(),
    queryFn: async () => {
      throw new Error("Calendars fetching is disabled - use cache only");
    },
    enabled: false, // Always disabled - only read from cache
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Get cached values
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

  // Determine connection status and calendars
  const isConnected =
    connectionStatusQuery.data ?? cachedConnectionStatus ?? false;
  const calendars = calendarsQuery.data ?? cachedCalendars ?? [];
  const calendarsLoading = calendarsQuery.isLoading;
  const calendarsError = calendarsQuery.error
    ? calendarsQuery.error instanceof Error
      ? calendarsQuery.error.message
      : "Failed to fetch calendars"
    : null;

  // Check for OAuth callback in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google") === "connected") {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Invalidate queries to refresh connection status
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.all,
      });
    }
  }, [queryClient]);

  // Revoke access mutation
  const revokeMutation = useMutation({
    mutationFn: async () => {
      const response = await googleCalendarApi.revokeAccess();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to revoke access");
      }
      googleCalendarApi.clearConnectionStatus();
    },
    onSuccess: () => {
      // Clear all Google Calendar queries
      void queryClient.removeQueries({
        queryKey: queryKeys.googleCalendar.all,
      });
    },
  });

  const refreshCalendars = useCallback(async () => {
    // Refresh is disabled - calendars are only fetched via initial prefetch
    // This function is kept for API compatibility but does nothing
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

  // Memoize the date parameters to prevent infinite re-renders
  const eventParams = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
    };
  }, []); // Empty dependency array - these dates should be stable for the component lifecycle

  const {
    events,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent,
  } = useGoogleEvents(eventParams);

  const {
    setIsConnected,
    setCalendars,
    setCalendarsLoading,
    setCalendarsError,
    setEvents,
    setEventsLoading,
    setEventsError,
  } = useGoogleCalendarStore();

  // Prevent redundant updates by tracking last applied values
  const lastIsConnectedRef = useRef<typeof isConnected>();
  const lastCalendarsRef = useRef<typeof calendars>();
  const lastCalendarsLoadingRef = useRef<typeof calendarsLoading>();
  const lastCalendarsErrorRef = useRef<typeof calendarsError>();
  const lastEventsRef = useRef<typeof events>();
  const lastEventsLoadingRef = useRef<typeof eventsLoading>();
  const lastEventsErrorRef = useRef<typeof eventsError>();

  // Sync hook data with store
  useEffect(() => {
    if (lastIsConnectedRef.current !== isConnected) {
      lastIsConnectedRef.current = isConnected;
      setIsConnected(isConnected);
    }
  }, [isConnected, setIsConnected]);

  useEffect(() => {
    if (lastCalendarsRef.current !== calendars) {
      lastCalendarsRef.current = calendars;
      setCalendars(calendars);
    }
  }, [calendars, setCalendars]);

  useEffect(() => {
    if (lastCalendarsLoadingRef.current !== calendarsLoading) {
      lastCalendarsLoadingRef.current = calendarsLoading;
      setCalendarsLoading(calendarsLoading);
    }
  }, [calendarsLoading, setCalendarsLoading]);

  useEffect(() => {
    if (lastCalendarsErrorRef.current !== calendarsError) {
      lastCalendarsErrorRef.current = calendarsError;
      setCalendarsError(calendarsError);
    }
  }, [calendarsError, setCalendarsError]);

  useEffect(() => {
    if (lastEventsRef.current !== events) {
      lastEventsRef.current = events;
      setEvents(events);
    }
  }, [events, setEvents]);

  useEffect(() => {
    if (lastEventsLoadingRef.current !== eventsLoading) {
      lastEventsLoadingRef.current = eventsLoading;
      setEventsLoading(eventsLoading);
    }
  }, [eventsLoading, setEventsLoading]);

  useEffect(() => {
    if (lastEventsErrorRef.current !== eventsError) {
      lastEventsErrorRef.current = eventsError;
      setEventsError(eventsError);
    }
  }, [eventsError, setEventsError]);

  return {
    // Connection status
    isConnected,

    // Calendars
    calendars,
    calendarsLoading,
    calendarsError,
    refreshCalendars,

    // Events
    events,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent,

    // Actions
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  };
}
