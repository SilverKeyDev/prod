import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import type {
  GoogleEvent,
  GoogleEventListResponse,
} from "packages/config/api/calendar/googleCalendar";
import { queryKeys } from "packages/config/query/keys";
import type {
  FreebusyResponse,
  FreebusyTimeBlock,
} from "packages/schemas/scheduling";
import { getBusyBlocksFromResponse } from "packages/utils/domain/calendar/scheduling";

export type UseClientEventsReturn = {
  events: GoogleEvent[];
  availability: FreebusyTimeBlock[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Hook to fetch client events and availability for agents
 * Returns full event details and busy blocks for a client's calendar
 *
 * @param clientId - Client user ID
 * @param timeMin - Start time in ISO 8601 format
 * @param timeMax - End time in ISO 8601 format
 * @param calendarId - Optional calendar ID to fetch events from (defaults to "primary")
 * @param calendarIds - Optional list of calendar IDs to check availability (defaults to ["primary"])
 */
export function useClientEvents(
  clientId: string | null,
  timeMin: string,
  timeMax: string,
  calendarId?: string,
  calendarIds?: string[],
): UseClientEventsReturn {
  // Disable fetching - only read from cache
  // Client events are not prefetched or polled, so this will return empty if not cached
  const {
    data: eventsResponse,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery<GoogleEventListResponse>({
    queryKey: [
      ...queryKeys.googleCalendar.all,
      "client-events",
      clientId!,
      timeMin,
      timeMax,
      calendarId || "primary",
    ],
    queryFn: async () => {
      // This should never be called since enabled is always false
      // But we need to provide a function for React Query
      throw new Error("Client event fetching is disabled - use cache only");
    },
    // Always disabled - only read from cache, never fetch
    enabled: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const {
    data: freebusyResponse,
    isLoading: availabilityLoading,
    error: availabilityError,
  } = useQuery<FreebusyResponse>({
    queryKey: [
      ...queryKeys.googleCalendar.all,
      "client-availability",
      clientId!,
      timeMin,
      timeMax,
      calendarIds?.join(",") || "primary",
    ],
    queryFn: async () => {
      // This should never be called since enabled is always false
      // But we need to provide a function for React Query
      throw new Error(
        "Client availability fetching is disabled - use cache only",
      );
    },
    enabled: false, // Always disabled - only read from cache, never fetch
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Extract events from response
  const events = useMemo(() => {
    if (!eventsResponse) {
      return [];
    }
    return eventsResponse.items || [];
  }, [eventsResponse]);

  // Process freebusy response to extract busy blocks
  const availability = useMemo(() => {
    if (!freebusyResponse) {
      return [];
    }
    return getBusyBlocksFromResponse(freebusyResponse.calendars);
  }, [freebusyResponse]);

  const isLoading = eventsLoading || availabilityLoading;
  const error = eventsError?.message ?? availabilityError?.message ?? null;

  const refetch = async () => {
    // Refetch is disabled - client events/availability are not fetched via this hook
    // This function is kept for API compatibility but does nothing
  };

  return {
    events,
    availability,
    isLoading,
    error,
    refetch,
  };
}
