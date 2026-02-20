import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { log, LOG_CATEGORIES } from "logger";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import {
  useCalendarErrorToasts,
  useCalendarOAuthCallback,
  useCalendarPreferences,
  useClientEvents,
  useGoogleCalendarPermissions,
} from "packages/hooks/data/calendar";
import { useGoogleCalendarStoreIntegration } from "packages/hooks/store/calendar/useGoogleCalendarStoreIntegration";
import type { UIState } from "packages/store";
import { useUIStore } from "packages/store";
import { dateNow } from "packages/utils/core/date";
import {
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "packages/utils/domain/calendar/calendar";
import {
  calculateCalendarDateRange,
  navigateDate,
} from "packages/utils/domain/calendar/date";

import { ClientSelector } from "@/components/ui/index.web";

import { CalendarConnectionPrompt } from "./components/CalendarConnectionPrompt";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarView } from "./components/CalendarView";
import { CreateEventModal } from "./components/CreateEventModal";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(() => dateNow().toDate());
  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(
    new Set(),
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

  const dateRange = useMemo(() => {
    return calculateCalendarDateRange(currentDate);
  }, [currentDate]);

  const {
    availability: clientAvailability,
    isLoading: clientEventsLoading,
    error: clientEventsError,
  } = useClientEvents(
    selectedClientId,
    dateRange.timeMin,
    dateRange.timeMax,
    "primary",
    ["primary"],
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

  useCalendarOAuthCallback({
    enqueueToast,
    refreshCalendars,
    refreshEvents,
  });

  useCalendarErrorToasts({
    calendarsError,
    eventsError,
    clientEventsError,
    enqueueToast,
  });

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
        silverKeyCalendarIdRef.current,
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
              silverKeyCalendarIdRef.current,
            );
            await refreshUserPreferences();
          } catch (error) {
            log.error(
              LOG_CATEGORIES.CALENDAR,
              "Failed to save calendar preferences",
              error,
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
    [calendars, refreshUserPreferences, enqueueToast, savePreferences],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
    [],
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
