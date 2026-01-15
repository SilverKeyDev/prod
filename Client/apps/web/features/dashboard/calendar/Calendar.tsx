import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGoogleCalendarStoreIntegration } from "../../../../../packages/hooks/store/calendar/useGoogleCalendarStoreIntegration";
import { useUserPreferences } from "../../../../../packages/hooks/data/auth/useUserData";
import { useUIStore } from "../../../../../packages/store";
import type { UIState } from "../../../../../packages/store/ui.slice";
import { CalendarConnectionPrompt } from "./components/CalendarConnectionPrompt";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { EventList } from "./components/EventList";
import { CreateEventModal } from "./components/CreateEventModal";
import { log, LOG_CATEGORIES } from "../../../../../logger";
import ClientSelector from "../../../components/ui/ClientSelector";
import {
  useClientEvents,
  useGoogleCalendarPermissions,
  useGoogleEvents,
  useCalendarPreferences,
} from "../../../../../packages/hooks/data/calendar";
import {
  calculateCalendarDateRange,
  navigateDate,
} from "../../../../../packages/utils/calendar/date";
import {
  findSilverKeyCalendar,
  initializeEnabledCalendars,
  getCalendarsKey,
} from "../../../../../packages/utils/calendar/calendar";
import {
  filterEventsByCalendars,
  filterUpcomingEvents,
} from "../../../../../packages/utils/calendar/eventFiltering";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(
    new Set()
  );
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [selectedDateForEvent, setSelectedDateForEvent] = useState<
    Date | undefined
  >(undefined);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [visibleDateRange, setVisibleDateRange] = useState<{
    firstDate: Date;
    lastDate: Date;
  } | null>(null);
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const { userPreferences, refreshUserPreferences } = useUserPreferences();
  const { savePreferences } = useCalendarPreferences();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");
  const hadDisabledCalendarsRef = useRef(false);

  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    eventsLoading,
    eventsError,
    refreshCalendars,
    refreshEvents,
    connectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  const {
    permissionsLoading,
    hasRequiredPermissions,
    isPartiallyEnabled,
    permissions,
  } = useGoogleCalendarPermissions();

  // Recalculate daily to ensure we always have the current week's range
  // This ensures cache hits even if prefetch happened days ago
  // Track date string in state to trigger recalculation only when date changes
  const [todayDateString, setTodayDateString] = useState(() =>
    new Date().toDateString()
  );
  const lastCheckedDateRef = useRef<string>(todayDateString);

  // Update date string only when it changes to a new day (check periodically)
  useEffect(() => {
    const checkDate = () => {
      const currentDateString = new Date().toDateString();
      if (currentDateString !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentDateString;
        setTodayDateString(currentDateString);
      }
    };

    // Check immediately
    checkDate();

    // Check every hour to catch date changes
    const interval = setInterval(checkDate, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, []); // Empty deps - only run on mount/unmount

  const dateRange = useMemo(() => {
    return calculateCalendarDateRange(currentDate);
  }, [currentDate]);

  const {
    events: clientEvents,
    availability: clientAvailability,
    isLoading: clientEventsLoading,
    error: clientEventsError,
  } = useClientEvents(
    selectedClientId,
    dateRange.timeMin,
    dateRange.timeMax,
    "primary",
    ["primary"]
  );

  // Note: CalendarView now handles its own event fetching from cache
  // We no longer need to fetch events here

  const silverKeyCalendarIdRef = useRef<string | null>(null);

  // Get SilverKey calendar from cache
  useEffect(() => {
    if (!isConnected || !calendars || calendars.length === 0) {
      return;
    }

    const silverKeyCalendar = findSilverKeyCalendar(calendars);
    if (silverKeyCalendar) {
      // Calendar exists - update ref
      silverKeyCalendarIdRef.current = silverKeyCalendar.id;
    }
  }, [isConnected, calendars]);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("google") === "connected") {
      enqueueToast({
        type: "success",
        message: "Google Calendar connected successfully",
      });
      window.history.replaceState({}, document.title, window.location.pathname);
      void refreshCalendars();
      void refreshEvents();
    }
  }, [enqueueToast, refreshCalendars, refreshEvents]);

  // Handle errors
  useEffect(() => {
    if (calendarsError) {
      enqueueToast({
        type: "error",
        message: `Calendar error: ${calendarsError}`,
      });
    }
    if (eventsError) {
      enqueueToast({
        type: "error",
        message: `Events error: ${eventsError}`,
      });
    }
    if (clientEventsError) {
      enqueueToast({
        type: "error",
        message: `Client events error: ${clientEventsError}`,
      });
    }
  }, [
    calendarsError,
    eventsError,
    clientEventsError,
    enqueueToast,
  ]);

  // Initialize enabled calendars from preferences
  useEffect(() => {
    if (!calendars || calendars.length === 0) {
      return;
    }

    const calendarsKey = getCalendarsKey(calendars);
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;

    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);
    const disabledCalendarsJustLoaded =
      !hadDisabledCalendarsRef.current && hasDisabledCalendars;

    if (hasDisabledCalendars) {
      hadDisabledCalendarsRef.current = true;
    }

    const silverKeyCalendar = findSilverKeyCalendar(calendars);
    if (silverKeyCalendar) {
      silverKeyCalendarIdRef.current = silverKeyCalendar.id;
    }

    if (
      !initializedFromPreferencesRef.current ||
      calendarsChanged ||
      disabledCalendarsJustLoaded
    ) {
      const enabledSet = initializeEnabledCalendars(
        calendars,
        hasDisabledCalendars ? disabledCalendars : undefined,
        silverKeyCalendarIdRef.current
      );
      setEnabledCalendarIds(enabledSet);
      initializedFromPreferencesRef.current = true;
      lastCalendarsRef.current = calendarsKey;
    }
  }, [calendars, userPreferences]);

  // Handle toggling calendar visibility and save to preferences
  const handleToggleCalendar = useCallback(
    (calendarId: string, enabled: boolean) => {
      if (
        silverKeyCalendarIdRef.current &&
        calendarId === silverKeyCalendarIdRef.current &&
        !enabled
      ) {
        enqueueToast({
          type: "info",
          message: "SilverKey calendar cannot be disabled",
        });
        return;
      }

      setEnabledCalendarIds((prev) => {
        const newSet = new Set(prev);
        if (enabled) {
          newSet.add(calendarId);
        } else {
          newSet.delete(calendarId);
        }

        if (silverKeyCalendarIdRef.current) {
          newSet.add(silverKeyCalendarIdRef.current);
        }

        // Debounced save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await savePreferences(
              calendars || [],
              newSet,
              silverKeyCalendarIdRef.current
            );
            await refreshUserPreferences();
          } catch (error) {
            log.error(
              LOG_CATEGORIES.CALENDAR,
              "Failed to save calendar preferences",
              error
            );
            enqueueToast({
              type: "error",
              message: "Failed to save calendar preferences",
            });
          }
        }, 500);

        return newSet;
      });
    },
    [calendars, refreshUserPreferences, enqueueToast]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Note: CalendarView handles its own event reading from cache
  // We still need upcoming events for the EventList component
  // Read from cache only (no fetching on navigation)
  // Use standard 5-week range, then filter to next 7 days
  // Reuse the same todayDateString state to avoid duplicate state
  const upcomingDateRange = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 999);
    return {
      timeMin: today.toISOString(),
      timeMax: nextWeek.toISOString(),
    };
  }, [todayDateString]);

  // Read upcoming events using React Query hook (cache-only)
  // Events are prefetched by initialDataLoader on page load
  const { events: upcomingEventsRaw } = useGoogleEvents({
    calendarIds: Array.from(enabledCalendarIds),
    timeMin: upcomingDateRange.timeMin,
    timeMax: upcomingDateRange.timeMax,
    enabled:
      isConnected &&
      calendars &&
      calendars.length > 0 &&
      enabledCalendarIds.size > 0,
  });

  // Merge agent events with client events when viewing a client for upcoming events
  const allUpcomingEvents = useMemo(() => {
    if (selectedClientId !== null && clientEvents.length > 0) {
      // Add client events with a marker to distinguish them
      const clientEventsWithMarker = clientEvents.map((event) => ({
        ...event,
        calendarId: event.calendarId || "client-primary",
        isClientEvent: true,
      }));
      return [...upcomingEventsRaw, ...clientEventsWithMarker];
    }
    return upcomingEventsRaw;
  }, [upcomingEventsRaw, clientEvents, selectedClientId]);

  // Filter upcoming events
  const filteredUpcomingEvents = useMemo(
    () =>
      filterEventsByCalendars(
        allUpcomingEvents,
        enabledCalendarIds,
        calendars || []
      ),
    [allUpcomingEvents, enabledCalendarIds, calendars]
  );

  const upcomingEvents = useMemo(
    () =>
      filterUpcomingEvents(
        filteredUpcomingEvents,
        silverKeyCalendarIdRef.current
      ),
    [filteredUpcomingEvents]
  );

  // Date navigation handlers
  const handlePreviousWeek = useCallback(() => {
    setCurrentDate((prev) => navigateDate(prev, -1));
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentDate((prev) => navigateDate(prev, 1));
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDateForEvent(date);
    setIsCreateEventModalOpen(true);
  }, []);

  const handleOpenCreateEventModal = useCallback(() => {
    setSelectedDateForEvent(undefined);
    setIsCreateEventModalOpen(true);
  }, []);

  const handleEventCreated = useCallback(() => {
    void refreshEvents();
  }, [refreshEvents]);

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  const handleVisibleDatesChange = useCallback(
    (firstDate: Date, lastDate: Date) => {
      setVisibleDateRange({ firstDate, lastDate });
    },
    []
  );

  // All hooks must be called before any conditional returns
  const shouldShowConnectionPrompt = useMemo(() => {
    if (!isConnected) {
      return true;
    }
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) {
        return true;
      }
    }
    return false;
  }, [isConnected, permissions, hasRequiredPermissions, isPartiallyEnabled]);

  const isViewingOwnCalendar = selectedClientId === null;

  // Permission and connection checks (after all hooks)
  const permissionsReady = !permissionsLoading && permissions !== undefined;

  if (!permissionsReady) {
    return (
      <div className="w-full">
        <div className="mb-4 text-center text-sm text-gray-500">
          Loading calendar permissions...
        </div>
      </div>
    );
  }

  if (shouldShowConnectionPrompt) {
    return (
      <div className="w-full">
        <CalendarConnectionPrompt
          onConnect={handleConnect}
          isLoading={calendarsLoading}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <ClientSelector
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
          className="w-full sm:w-auto"
        />
      </div>

      {isViewingOwnCalendar && upcomingEvents.length > 0 && (
        <div className="mb-8">
          <EventList
            events={upcomingEvents}
            title="Upcoming Events (Next 7 Days)"
            emptyMessage="No upcoming events"
          />
        </div>
      )}

      <CalendarHeader
        currentDate={currentDate}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        isConnected={isConnected}
        calendars={calendars || []}
        enabledCalendarIds={enabledCalendarIds}
        onToggleCalendar={handleToggleCalendar}
        silverKeyCalendarId={silverKeyCalendarIdRef.current}
        onCreateEvent={handleOpenCreateEventModal}
        visibleDateRange={visibleDateRange}
      />

      {(calendarsLoading ||
        eventsLoading ||
        (!isViewingOwnCalendar && clientEventsLoading)) && (
        <div className="mb-4 text-center text-sm text-gray-500">
          {!isViewingOwnCalendar && "Loading client calendar..."}
        </div>
      )}

      <div className="mb-8">
        <CalendarView
          currentDate={currentDate}
          availability={!isViewingOwnCalendar ? clientAvailability : undefined}
          silverKeyCalendarId={silverKeyCalendarIdRef.current}
          onDateClick={handleDateClick}
          onVisibleDatesChange={handleVisibleDatesChange}
        />
      </div>

      <CreateEventModal
        isOpen={isCreateEventModalOpen}
        onClose={() => setIsCreateEventModalOpen(false)}
        initialDate={selectedDateForEvent}
        calendars={calendars || []}
        defaultCalendarId={silverKeyCalendarIdRef.current}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}
