import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useMemo } from "react";

import { queryKeys } from "../../config/query/keys";
import { useAuthStore } from "../../store/auth.slice";
import { googleCalendarService } from "../../services/googleCalendar";
import { googleCalendarApi } from "../../config/api/googleCalendar";
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
  const [calendarsLoading, setCalendarsLoading] = useState<boolean>(false);
  const [calendarsError, setCalendarsError] = useState<string | null>(null);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  // Check cache first to show data immediately
  const cachedCalendars = useMemo(() => {
    if (!shouldLoadData) return undefined;
    return queryClient.getQueryData<GoogleCalendar[]>(
      queryKeys.googleCalendar.calendars()
    );
  }, [shouldLoadData, queryClient]);

  const cachedConnectionStatus = useMemo(() => {
    if (!shouldLoadData) return undefined;
    return queryClient.getQueryData<boolean>([
      ...queryKeys.googleCalendar.all,
      "connection",
    ]);
  }, [shouldLoadData, queryClient]);

  // Use React Query to fetch calendars (matches dataConfig prefetch)
  const {
    data: calendarsData,
    isLoading: calendarsQueryLoading,
    error: calendarsQueryError,
    refetch: refetchCalendarsQuery,
  } = useQuery({
    queryKey: queryKeys.googleCalendar.calendars(),
    queryFn: async () => {
      const response = await googleCalendarApi.listCalendars();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch calendars");
      }
      return response.data?.items ?? [];
    },
    enabled: shouldLoadData,
    // Use placeholderData to show cached data immediately
    placeholderData: (previousValue) => {
      return cachedCalendars ?? previousValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });

  // Use React Query to check connection status (matches dataConfig prefetch)
  const {
    data: connectionStatus,
  } = useQuery({
    queryKey: [...queryKeys.googleCalendar.all, "connection"],
    queryFn: async () => {
      return await googleCalendarApi.isConnected();
    },
    enabled: shouldLoadData,
    // Use placeholderData to show cached data immediately
    placeholderData: (previousValue) => {
      return cachedConnectionStatus ?? previousValue;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
  });

  // Sync React Query data with local state and service
  // Return cached calendars if available, otherwise use response
  const calendars = useMemo(() => {
    return calendarsData ?? cachedCalendars ?? [];
  }, [calendarsData, cachedCalendars]);
  
  // Initialize connection status from cache immediately
  useEffect(() => {
    const status = connectionStatus ?? cachedConnectionStatus;
    if (shouldLoadData && status !== undefined) {
      setIsConnected(status);
      googleCalendarService.setConnectionStatus(status);
    }
  }, [connectionStatus, cachedConnectionStatus, shouldLoadData]);

  // Initialize calendars from cache immediately
  useEffect(() => {
    if (shouldLoadData) {
      if (calendarsData && calendarsData.length > 0) {
        googleCalendarService.setCalendars(calendarsData);
      } else {
        // Check cache for calendars if query hasn't run yet
        const cachedCalendars = queryClient.getQueryData<GoogleCalendar[]>(
          queryKeys.googleCalendar.calendars()
        );
        if (cachedCalendars && cachedCalendars.length > 0) {
          googleCalendarService.setCalendars(cachedCalendars);
        }
      }
    }
  }, [calendarsData, shouldLoadData, queryClient]);

  // Initialize service callbacks for error handling
  useEffect(() => {
    googleCalendarService.setCallbacks({
      onStateChange: (state) => {
        // Only update loading/error from service if React Query isn't managing it
        if (!shouldLoadData) {
          setCalendarsLoading(state.isLoading);
          setCalendarsError(state.error);
        }
      },
      onError: (error) => {
        if (!shouldLoadData) {
          setCalendarsError(error);
        }
      },
      onSuccess: () => {
        // Service success handled by React Query
      },
    });
  }, [shouldLoadData]);

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

  // Sync loading and error states from React Query
  useEffect(() => {
    setCalendarsLoading(calendarsQueryLoading);
    if (calendarsQueryError) {
      setCalendarsError(calendarsQueryError.message ?? "Failed to fetch calendars");
    } else {
      setCalendarsError(null);
    }
  }, [calendarsQueryLoading, calendarsQueryError]);

  // Don't fetch via service if React Query has data (prevents duplicate requests)
  // Only use service for mutations and OAuth flow

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
    // Refresh via React Query
    await refetchCalendarsQuery();
    // Also refresh service for backward compatibility
    await googleCalendarService.fetchCalendars();
  }, [refetchCalendarsQuery]);

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

  // Check cache first to show data immediately
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);
  
  const queryKey = useMemo(() => {
    return queryKeys.googleCalendar.eventsList(memoizedParams);
  }, [memoizedParams]);

  // Check for cached events with exact query key match
  const cachedEvents = useMemo(() => {
    if (!shouldLoadData) return undefined;
    return queryClient.getQueryData<GoogleEvent[]>(queryKey);
  }, [shouldLoadData, queryClient, queryKey]);

  // Check for prefetched events (from dataConfig) even if query key doesn't match exactly
  // This handles the case where dataConfig prefetches with different timeMin/timeMax
  const prefetchedEvents = useMemo(() => {
    if (!shouldLoadData || !memoizedParams?.calendarId) return undefined;
    
    // First check exact match
    const exactMatch = queryClient.getQueryData<GoogleEvent[]>(queryKey);
    if (exactMatch !== undefined) return exactMatch;
    
    // Then check for any prefetched events for this calendar (from dataConfig)
    // Use getQueriesData to find all events queries for this calendar
    // The prefetched data uses: queryKeys.googleCalendar.eventsList({ calendarId: "primary" })
    // without timeMin/timeMax, so we need to check for that
    const eventsListPrefix = queryKeys.googleCalendar.events();
    const allEventsQueries = queryClient.getQueriesData<GoogleEvent[]>({
      queryKey: eventsListPrefix,
      exact: false, // Match any query that starts with the events prefix
    });
    
    // Find the prefetched data for this calendar
    // Look for queries with calendarId matching our calendar
    for (const [key, data] of allEventsQueries) {
      if (!data || !Array.isArray(data)) continue;
      
      // Extract calendarId from the query key
      // Query key structure: ["googleCalendar", "events", "list", { calendarId: "...", ... }]
      // The params object is at index 3
      if (Array.isArray(key) && key.length >= 4) {
        const keyParams = key[3] as { calendarId?: string } | undefined;
        if (keyParams?.calendarId === memoizedParams.calendarId) {
          // Found prefetched data for this calendar
          const timeMin = memoizedParams.timeMin ? new Date(memoizedParams.timeMin) : null;
          const timeMax = memoizedParams.timeMax ? new Date(memoizedParams.timeMax) : null;
          
          if (timeMin && timeMax && data.length > 0) {
            // Filter events by the requested time range
            return data.filter((event) => {
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
          
          // If no time range specified or empty data, return prefetched events as-is
          // Empty array is valid (indicates calendar was checked and has no events)
          return data;
        }
      }
    }
    
    return undefined;
  }, [shouldLoadData, queryClient, queryKey, memoizedParams]);

  // Use React Query to fetch events
  const {
    data: eventsData,
    isLoading: eventsQueryLoading,
    error: eventsQueryError,
    refetch: refetchEventsQuery,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!memoizedParams?.calendarId) {
        throw new Error("Calendar ID is required");
      }
      const response = await googleCalendarApi.listEvents({
        calendarId: memoizedParams.calendarId,
        timeMin: memoizedParams.timeMin,
        timeMax: memoizedParams.timeMax,
      });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch events");
      }
      return response.data?.items ?? [];
    },
    enabled: shouldLoadData && !!memoizedParams?.calendarId,
    // Use placeholderData to show cached/prefetched data immediately
    placeholderData: (previousValue) => {
      return cachedEvents ?? prefetchedEvents ?? previousValue;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - events can change frequently
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnMount: false, // Don't refetch if data exists (matches other hooks)
  });

  // Initialize events from cache/prefetched data immediately on mount
  // This ensures events are populated from prefetched data before React Query runs
  useEffect(() => {
    if (!shouldLoadData) return;
    
    // Use eventsData first (from React Query), then cachedEvents (exact match), 
    // then prefetchedEvents (from dataConfig), then current state
    const eventsToUse = eventsData ?? cachedEvents ?? prefetchedEvents;
    
    // Always set events if we have data, even if empty array (indicates we've loaded)
    // This ensures prefetched data is used immediately on mount
    if (eventsToUse !== undefined) {
      setEvents(eventsToUse);
    }
  }, [shouldLoadData, eventsData, cachedEvents, prefetchedEvents]);

  // Immediate initialization when shouldLoadData becomes true
  // This runs synchronously to populate events from prefetched data before React Query
  useEffect(() => {
    if (!shouldLoadData || !memoizedParams?.calendarId) return;
    
    // Only initialize if we don't already have events
    if (events.length > 0) return;
    
    // Check for prefetched data immediately
    const eventsListPrefix = queryKeys.googleCalendar.events();
    const allEventsQueries = queryClient.getQueriesData<GoogleEvent[]>({
      queryKey: eventsListPrefix,
      exact: false,
    });
    
    // Find prefetched data for this calendar
    for (const [key, data] of allEventsQueries) {
      if (!data || !Array.isArray(data)) continue;
      
      if (Array.isArray(key) && key.length >= 4) {
        const keyParams = key[3] as { calendarId?: string } | undefined;
        if (keyParams?.calendarId === memoizedParams.calendarId) {
          // Found prefetched data - set it immediately
          const timeMin = memoizedParams.timeMin ? new Date(memoizedParams.timeMin) : null;
          const timeMax = memoizedParams.timeMax ? new Date(memoizedParams.timeMax) : null;
          
          if (timeMin && timeMax && data.length > 0) {
            // Filter by time range
            const filtered = data.filter((event) => {
              const eventStart = event.start?.dateTime 
                ? new Date(event.start.dateTime) 
                : event.start?.date 
                ? new Date(event.start.date) 
                : null;
              
              if (!eventStart) return false;
              
              const eventEnd = event.end?.dateTime 
                ? new Date(event.end.dateTime) 
                : event.end?.date 
                ? new Date(event.end.date) 
                : eventStart;
              
              return eventStart <= timeMax && eventEnd >= timeMin;
            });
            
            setEvents(filtered);
          } else {
            // No time range or empty data - use as-is
            setEvents(data);
          }
          break; // Found matching calendar, stop searching
        }
      }
    }
  }, [shouldLoadData, memoizedParams?.calendarId, queryClient, memoizedParams?.timeMin, memoizedParams?.timeMax]);

  useEffect(() => {
    setEventsLoading(eventsQueryLoading);
  }, [eventsQueryLoading]);

  useEffect(() => {
    if (eventsQueryError) {
      setEventsError(eventsQueryError.message ?? "Failed to fetch events");
    } else {
      setEventsError(null);
    }
  }, [eventsQueryError]);

  // Initialize service callbacks for events (for backward compatibility)
  useEffect(() => {
    googleCalendarService.setCallbacks({
      onStateChange: (state) => {
        // Only update if React Query isn't managing it
        if (!shouldLoadData) {
          setEventsLoading(state.isLoading);
          setEventsError(state.error);
          if (state.events && Array.isArray(state.events)) {
            setEvents(state.events as GoogleEvent[]);
          }
        }
      },
      onError: (error) => {
        if (!shouldLoadData) {
          setEventsError(error);
        }
      },
      onSuccess: (data) => {
        if (!shouldLoadData && data.events && Array.isArray(data.events)) {
          setEvents(data.events as GoogleEvent[]);
        }
      },
    });

    // Initialize state from service if React Query isn't managing it
    if (!shouldLoadData) {
      const initialState = googleCalendarService.getState();
      setEventsLoading(initialState.isLoading);
      setEventsError(initialState.error);
      if (initialState.events && Array.isArray(initialState.events)) {
        setEvents(initialState.events as GoogleEvent[]);
      }
    }
  }, [shouldLoadData]);

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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.eventsList(),
      });
    },
  });

  const refreshEvents = useCallback(async () => {
    if (shouldLoadData && memoizedParams?.calendarId) {
      // Refresh via React Query
      await refetchEventsQuery();
    } else {
      // Fallback to service for backward compatibility
      await googleCalendarService.fetchEvents(memoizedParams);
    }
  }, [memoizedParams, shouldLoadData, refetchEventsQuery]);

  const createEvent = useCallback(
    async (event: GoogleEvent): Promise<GoogleEventCreateResponse> => {
      return (await createEventMutation.mutateAsync(
        event,
      )) as GoogleEventCreateResponse;
    },
    [createEventMutation],
  );

  // Return cached/prefetched events if available, otherwise use state
  const finalEvents = useMemo(() => {
    return eventsData ?? cachedEvents ?? prefetchedEvents ?? events;
  }, [eventsData, cachedEvents, prefetchedEvents, events]);

  return {
    events: finalEvents,
    eventsLoading,
    eventsError,
    refreshEvents,
    createEvent,
    isCreatingEvent: createEventMutation.isPending,
  };
}
