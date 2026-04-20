import { useCallback, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import type {
  FreebusyTimeBlock,
  ScheduleEventRequest,
  WorkingHours,
} from "packages/schemas/scheduling";
import { useSchedulingStore } from "packages/store";
import { useGoogleCalendarStore } from "packages/store";

import {
  createScheduledEvent,
  generateAvailableTimeSlots,
  getOrCreateSilverKeyCalendar,
  queryAvailability,
} from "@/features/calendar/api/schedulingQueries";
import { getDefaultWorkingHours } from "@/features/calendar/utils/core/scheduling";

/**
 * Hook to query availability using freebusy API
 */
export function useAvailability(
  timeMin: string,
  timeMax: string,
  calendarIds?: string[],
  enabled: boolean = true
) {
  const store = useSchedulingStore();
  const isConnected = useGoogleCalendarStore((s) => s.isConnected);

  const query = useQuery({
    queryKey: queryKeys.scheduling.availability(timeMin, timeMax, calendarIds),
    queryFn: async () => {
      store.setLoadingAvailability(true);
      store.setAvailabilityError(null);
      try {
        const availability = await queryAvailability(timeMin, timeMax, calendarIds);
        store.setAvailability(availability);
        return availability;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch availability";
        store.setAvailabilityError(errorMessage);
        throw error;
      } finally {
        store.setLoadingAvailability(false);
      }
    },
    enabled: enabled && isConnected && !!timeMin && !!timeMax,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    availability: query.data || [],
    isLoading: query.isLoading || store.isLoadingAvailability,
    error: query.error || store.availabilityError,
    refetch: query.refetch,
  };
}

/**
 * Hook to generate time slots from availability
 */
export function useTimeSlots(
  availability: FreebusyTimeBlock[],
  startDate: Date,
  endDate: Date,
  slotDurationMinutes: number = 30,
  workingHours?: WorkingHours
) {
  const store = useSchedulingStore();

  const slots = useMemo(() => {
    if (!availability.length) {
      return [];
    }

    const generatedSlots = generateAvailableTimeSlots(
      availability,
      startDate,
      endDate,
      slotDurationMinutes,
      workingHours || getDefaultWorkingHours()
    );

    store.setAvailableSlots(generatedSlots);
    return generatedSlots;
  }, [availability, startDate, endDate, slotDurationMinutes, workingHours, store]);

  return {
    slots,
    availableSlots: slots.filter((slot) => slot.isAvailable),
  };
}

/**
 * Hook to manage SilverKey calendar
 */
export function useSilverKeyCalendar(buyerName?: string) {
  const store = useSchedulingStore();
  const queryClient = useQueryClient();
  const isConnected = useGoogleCalendarStore((s) => s.isConnected);

  const query = useQuery({
    queryKey: queryKeys.scheduling.silverKeyCalendar(),
    queryFn: async () => {
      store.setLoadingCalendar(true);
      store.setCalendarError(null);
      try {
        const calendar = await getOrCreateSilverKeyCalendar(buyerName);
        store.setSilverKeyCalendarId(calendar.id);
        return calendar;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to get or create SilverKey calendar";
        store.setCalendarError(errorMessage);
        throw error;
      } finally {
        store.setLoadingCalendar(false);
      }
    },
    enabled: isConnected,
    staleTime: Infinity, // Calendar ID doesn't change often
  });

  const createMutation = useMutation({
    mutationFn: async (name?: string) => {
      return await getOrCreateSilverKeyCalendar(name);
    },
    onSuccess: (calendar) => {
      store.setSilverKeyCalendarId(calendar.id);
      queryClient.setQueryData(queryKeys.scheduling.silverKeyCalendar(), calendar);
    },
  });

  return {
    calendar: query.data ?? null,
    calendarId: query.data?.id ?? store.silverKeyCalendarId,
    isLoading: query.isLoading || store.isLoadingCalendar,
    error: query.error || store.calendarError,
    refetch: query.refetch,
    createCalendar: createMutation.mutateAsync,
  };
}

/**
 * Hook to schedule an event
 */
export function useScheduleEvent() {
  const store = useSchedulingStore();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      eventData,
      calendarId,
    }: {
      eventData: ScheduleEventRequest;
      calendarId: string;
    }) => {
      return await createScheduledEvent(eventData, calendarId);
    },
    onSuccess: () => {
      // Invalidate availability queries to refresh
      void queryClient.invalidateQueries({
        queryKey: queryKeys.scheduling.all,
      });

      // Also invalidate Google Calendar queries so calendar views refetch.
      void queryClient.invalidateQueries({
        queryKey: queryKeys.googleCalendar.all,
      });

      // Clear selected slot after successful scheduling
      store.setSelectedSlot(null);
    },
  });

  const scheduleEvent = useCallback(
    async (eventData: ScheduleEventRequest, calendarId: string) => {
      return await mutation.mutateAsync({ eventData, calendarId });
    },
    [mutation]
  );

  return {
    scheduleEvent,
    isScheduling: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
  };
}

/**
 * Combined hook for scheduling workflow
 */
export function useScheduling(
  startDate: Date,
  endDate: Date,
  slotDurationMinutes: number = 30,
  workingHours?: WorkingHours,
  calendarIds?: string[]
) {
  const store = useSchedulingStore();

  // Format dates for API
  const timeMin = startDate.toISOString();
  const timeMax = endDate.toISOString();

  // Query availability
  const availability = useAvailability(timeMin, timeMax, calendarIds, true);

  // Generate time slots
  const timeSlots = useTimeSlots(
    availability.availability,
    startDate,
    endDate,
    slotDurationMinutes,
    workingHours
  );

  // Get SilverKey calendar
  const silverKeyCalendar = useSilverKeyCalendar();

  // Schedule event mutation
  const scheduleEvent = useScheduleEvent();

  return {
    // Availability
    availability: availability.availability,
    isLoadingAvailability: availability.isLoading,
    availabilityError: availability.error,

    // Time slots
    slots: timeSlots.slots,
    availableSlots: timeSlots.availableSlots,
    selectedSlot: store.selectedSlot,
    setSelectedSlot: store.setSelectedSlot,

    // SilverKey calendar
    silverKeyCalendarId: silverKeyCalendar.calendarId,
    isLoadingCalendar: silverKeyCalendar.isLoading,
    calendarError: silverKeyCalendar.error,

    // Scheduling
    scheduleEvent: async (eventData: ScheduleEventRequest) => {
      if (!silverKeyCalendar.calendarId) {
        throw new Error("SilverKey calendar not available");
      }
      return await scheduleEvent.scheduleEvent(eventData, silverKeyCalendar.calendarId);
    },
    isScheduling: scheduleEvent.isScheduling,
    schedulingError: scheduleEvent.error,

    // Refresh
    refetchAvailability: availability.refetch,
  };
}
