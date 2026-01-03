import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useMemo } from "react";

import { queryKeys } from "../../config/query/keys";
import { useAuthStore } from "../../store/auth.slice";
import { googleCalendarService } from "../../services/googleCalendar";
import type {
  GoogleCalendar,
  GoogleEvent,
  GoogleEventCreateResponse,
} from "../../config/api";

export type UseGoogleCalendarReturn = {
  isConnected: boolean;
  calendars: GoogleCalendar[];
  calendarsLoading: boolean;
  calendarsError: string | null;
  refreshCalendars: () => Promise<void>;
  connectGoogleCalendar: () => void;
  disconnectGoogleCalendar: () => Promise<void>;
};

export function useGoogleCalendar(): UseGoogleCalendarReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [calendarsLoading, setCalendarsLoading] = useState<boolean>(false);
  const [calendarsError, setCalendarsError] = useState<string | null>(null);

  // Initialize service callbacks
  useEffect(() => {
    googleCalendarService.setCallbacks({
      onStateChange: (state) => {
        setIsConnected(state.isConnected);
        setCalendarsLoading(state.isLoading);
        setCalendarsError(state.error);
        if (state.calendars && Array.isArray(state.calendars)) {
          setCalendars(state.calendars as GoogleCalendar[]);
        }
      },
      onError: (error) => {
        setCalendarsError(error);
      },
      onSuccess: (data) => {
        if (data.calendars && Array.isArray(data.calendars)) {
          setCalendars(data.calendars as GoogleCalendar[]);
        }
      },
    });

    // Initialize state from service
    const initialState = googleCalendarService.getState();
    setIsConnected(initialState.isConnected);
    setCalendarsLoading(initialState.isLoading);
    setCalendarsError(initialState.error);
    if (initialState.calendars && Array.isArray(initialState.calendars)) {
      setCalendars(initialState.calendars as GoogleCalendar[]);
    }
  }, []);

  // Check connection status and handle OAuth callback
  useEffect(() => {
    // Listen for URL parameters (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google") === "connected") {
      googleCalendarService.setConnectionStatus(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch calendars when connected
  useEffect(() => {
    if (authReady && isAuthenticated && isConnected && calendars.length === 0) {
      googleCalendarService.fetchCalendars();
    }
  }, [authReady, isAuthenticated, isConnected, calendars.length]);

  // Revoke access mutation
  const revokeMutation = useMutation({
    mutationFn: async () => {
      await googleCalendarService.revokeAccess();
    },
    onSuccess: () => {
      // Clear all Google Calendar queries
      void queryClient.removeQueries({
        queryKey: queryKeys.googleCalendar.all,
      });
    },
  });

  const refreshCalendars = useCallback(async () => {
    await googleCalendarService.fetchCalendars();
  }, []);

  const connectGoogleCalendar = useCallback(() => {
    googleCalendarService.startOAuth();
  }, []);

  const disconnectGoogleCalendar = useCallback(async () => {
    await revokeMutation.mutateAsync();
  }, [revokeMutation]);

  return {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    refreshCalendars,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  };
}

export type UseGoogleEventsReturn = {
  events: GoogleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  refreshEvents: () => Promise<void>;
  createEvent: (event: GoogleEvent) => Promise<GoogleEventCreateResponse>;
  isCreatingEvent: boolean;
};

export function useGoogleEvents(params?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
}): UseGoogleEventsReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Memoize params to prevent unnecessary re-renders
  const memoizedParams = useMemo(() => params, [params]);

  // Initialize service callbacks for events
  useEffect(() => {
    googleCalendarService.setCallbacks({
      onStateChange: (state) => {
        setEventsLoading(state.isLoading);
        setEventsError(state.error);
        if (state.events && Array.isArray(state.events)) {
          setEvents(state.events as GoogleEvent[]);
        }
      },
      onError: (error) => {
        setEventsError(error);
      },
      onSuccess: (data) => {
        if (data.events && Array.isArray(data.events)) {
          setEvents(data.events as GoogleEvent[]);
        }
      },
    });

    // Initialize state from service
    const initialState = googleCalendarService.getState();
    setEventsLoading(initialState.isLoading);
    setEventsError(initialState.error);
    if (initialState.events && Array.isArray(initialState.events)) {
      setEvents(initialState.events as GoogleEvent[]);
    }
  }, []);

  // Fetch events when connected
  useEffect(() => {
    if (authReady && isAuthenticated && events.length === 0) {
      // Check connection status asynchronously
      void googleCalendarService.isConnected().then((connected) => {
        if (connected) {
          googleCalendarService.fetchEvents(memoizedParams);
        }
      });
    }
  }, [authReady, isAuthenticated, events.length, memoizedParams]);

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (event: GoogleEvent) => {
      return await googleCalendarService.createEvent(event);
    },
    onSuccess: () => {
      // Invalidate events queries to refetch
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.events(),
      });
    },
  });

  const refreshEvents = useCallback(async () => {
    await googleCalendarService.fetchEvents(memoizedParams);
  }, [memoizedParams]);

  const createEvent = useCallback(
    async (event: GoogleEvent): Promise<GoogleEventCreateResponse> => {
      return (await createEventMutation.mutateAsync(
        event,
      )) as GoogleEventCreateResponse;
    },
    [createEventMutation],
  );

  return {
    events,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent: createEventMutation.isPending,
  };
}
