import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  GoogleCalendarEventCreateBody,
  GoogleEvent,
  GoogleEventCreateResponse,
} from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { googleCalendarApi } from "packages/features/calendar/api";
import { showErrorToast } from "packages/hooks/ui/toast";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { resolveApiResultErrorMessage } from "packages/utils/errorHandling";

import { buildEventsListQueryFn } from "./useGoogleEventsHelpers";

const EMPTY_GOOGLE_EVENTS: GoogleEvent[] = [];

export type UseGoogleEventsReturn = {
  events: GoogleEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  refreshEvents: () => Promise<void>;
  createEvent: (event: GoogleCalendarEventCreateBody) => Promise<GoogleEventCreateResponse>;
  isCreatingEvent: boolean;
  updateEvent: (
    eventId: string,
    event: GoogleEvent,
    calendarId?: string
  ) => Promise<GoogleEventCreateResponse>;
  deleteEvent: (eventId: string, calendarId?: string) => Promise<void>;
  isUpdatingEvent: boolean;
  isDeletingEvent: boolean;
};

function useGoogleEventsCore(
  params: Parameters<typeof useGoogleEvents>[0],
  queryClient: ReturnType<typeof useQueryClient>,
  shouldLoadData: boolean
) {
  const calendarId = params?.calendarId ?? "primary";
  const timeMin = params?.timeMin;
  const timeMax = params?.timeMax;

  const listEnabled = shouldLoadData && Boolean(timeMin && timeMax);

  const eventsQuery = useQuery({
    queryKey: queryKeys.googleCalendar.eventsList({
      calendarId,
      timeMin,
      timeMax,
    }),
    queryFn: buildEventsListQueryFn(calendarId, timeMin, timeMax),
    enabled: listEnabled,
    staleTime: 2 * 60 * 1000,
  });

  const refreshEvents = useCallback(async () => {
    if (timeMin && timeMax) {
      const queryKey = queryKeys.googleCalendar.eventsList({
        calendarId,
        timeMin,
        timeMax,
      });
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });
    } else {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.events(),
      });
    }
    log.debug("CALENDAR", "Refreshed Google Calendar events");
  }, [calendarId, timeMin, timeMax, queryClient]);

  return {
    events: eventsQuery.data ?? EMPTY_GOOGLE_EVENTS,
    eventsLoading: listEnabled && eventsQuery.isLoading,
    eventsError: eventsQuery.error
      ? eventsQuery.error instanceof Error
        ? eventsQuery.error.message
        : String(eventsQuery.error)
      : null,
    refreshEvents,
  };
}

/**
 * Google Calendar events for a single calendar (default `primary`; server resolves scope).
 */
export function useGoogleEvents(params?: {
  calendarId?: string;
  timeMin?: string;
  timeMax?: string;
  enabled?: boolean;
}): UseGoogleEventsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const shouldLoadData = useMemo(
    () => (params?.enabled ?? true) && authReady && isAuthenticated,
    [params?.enabled, authReady, isAuthenticated]
  );

  const core = useGoogleEventsCore(params, queryClient, shouldLoadData);

  const invalidateEvents = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.googleCalendar.all,
    });
  }, [queryClient]);

  const createEventMutation = useMutation({
    mutationFn: async (event: GoogleCalendarEventCreateBody) => {
      const response = await googleCalendarApi.createEvent(event);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to create event"));
      }
      return response.data as GoogleEventCreateResponse;
    },
    onSuccess: invalidateEvents,
    onError: (error) => {
      log.error("ERRORS", "Create calendar event failed", error);
      showErrorToast("Failed to create event. Please try again.");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({
      eventId,
      event,
    }: {
      eventId: string;
      event: GoogleEvent;
      calendarId?: string;
    }) => {
      const response = await googleCalendarApi.updateEvent(eventId, event);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to update event"));
      }
      return response.data as GoogleEventCreateResponse;
    },
    onSuccess: invalidateEvents,
    onError: (error) => {
      log.error("ERRORS", "Update calendar event failed", error);
      showErrorToast("Failed to update event. Please try again.");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async ({ eventId, calendarId }: { eventId: string; calendarId?: string }) => {
      const response = await googleCalendarApi.deleteEvent(eventId, calendarId);
      if (!response.success) {
        throw new Error(resolveApiResultErrorMessage(response, "Failed to delete event"));
      }
    },
    onSuccess: invalidateEvents,
    onError: (error) => {
      log.error("ERRORS", "Delete calendar event failed", error);
      showErrorToast("Failed to delete event. Please try again.");
    },
  });

  const createEvent = useCallback(
    async (event: GoogleCalendarEventCreateBody): Promise<GoogleEventCreateResponse> =>
      createEventMutation.mutateAsync(event) as Promise<GoogleEventCreateResponse>,
    [createEventMutation]
  );

  const updateEvent = useCallback(
    async (
      eventId: string,
      event: GoogleEvent,
      calendarId?: string
    ): Promise<GoogleEventCreateResponse> =>
      updateEventMutation.mutateAsync({
        eventId,
        event,
        calendarId,
      }) as Promise<GoogleEventCreateResponse>,
    [updateEventMutation]
  );

  const deleteEvent = useCallback(
    async (eventId: string, calendarId?: string): Promise<void> =>
      deleteEventMutation.mutateAsync({ eventId, calendarId }),
    [deleteEventMutation]
  );

  return {
    ...core,
    createEvent,
    isCreatingEvent: createEventMutation.isPending,
    updateEvent,
    deleteEvent,
    isUpdatingEvent: updateEventMutation.isPending,
    isDeletingEvent: deleteEventMutation.isPending,
  };
}
