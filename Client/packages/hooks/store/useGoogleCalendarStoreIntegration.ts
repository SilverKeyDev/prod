import { useEffect, useMemo, useRef } from "react";

import { useGoogleCalendarStore } from "packages/store";
import { dateNow } from "packages/utils/date";

import { useGoogleCalendar, useGoogleEvents } from "@/features/calendar/hooks/data";

/**
 * Hook that integrates useGoogleCalendar and useGoogleEvents with useGoogleCalendarStore
 * This follows the same pattern as useSavedHomesStoreIntegration and useReportsStoreIntegration
 */
export function useGoogleCalendarStoreIntegration() {
  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    refreshCalendars,
    connectGoogleCalendar,
    disconnectGoogleCalendar,
  } = useGoogleCalendar();

  // Memoize the date parameters to prevent infinite re-renders
  const eventParams = useMemo(() => {
    const now = dateNow();
    const sevenDaysFromNow = now.add(7, "day");

    return {
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: sevenDaysFromNow.toISOString(),
    };
  }, []); // Empty dependency array - these dates should be stable for the component lifecycle

  const { events, eventsLoading, eventsError, refreshEvents, createEvent, isCreatingEvent } =
    useGoogleEvents(eventParams);

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
