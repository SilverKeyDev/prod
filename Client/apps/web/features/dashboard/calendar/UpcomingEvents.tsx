import { useEffect, useMemo, useRef, useState, useCallback } from "react";

import { useGoogleCalendarStoreIntegration } from "../../../../../packages/hooks/store/calendar/useGoogleCalendarStoreIntegration";
import { useUserPreferences } from "../../../../../packages/hooks/data/auth/useUserData";
import { useGoogleCalendarPermissions, useGoogleEvents } from "../../../../../packages/hooks/data/calendar";

import { CalendarConnectionPrompt } from "./components/CalendarConnectionPrompt";
import { EventList } from "./components/EventList";

import {
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "../../../../../packages/utils/calendar/calendar";
import {
  filterEventsByCalendars,
  filterUpcomingEvents,
} from "../../../../../packages/utils/calendar/eventFiltering";

export function UpcomingEvents() {
  const {
    isConnected,
    calendars,
    calendarsLoading,
    connectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  const { userPreferences } = useUserPreferences();

  const {
    permissionsLoading,
    hasRequiredPermissions,
    isPartiallyEnabled,
    permissions,
  } = useGoogleCalendarPermissions();

  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(
    () => new Set()
  );

  const silverKeyCalendarIdRef = useRef<string | null>(null);
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");
  const hadDisabledCalendarsRef = useRef(false);

  // Recalculate daily to ensure our "next 7 days" window stays current
  const [todayDateString, setTodayDateString] = useState(() =>
    new Date().toDateString()
  );
  const lastCheckedDateRef = useRef<string>(todayDateString);

  useEffect(() => {
    const checkDate = () => {
      const currentDateString = new Date().toDateString();
      if (currentDateString !== lastCheckedDateRef.current) {
        lastCheckedDateRef.current = currentDateString;
        setTodayDateString(currentDateString);
      }
    };

    checkDate();

    const interval = setInterval(checkDate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize enabled calendars from preferences (read-only; no toggling here)
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

  const enabledCalendarIdsArray = useMemo(
    () => Array.from(enabledCalendarIds),
    [enabledCalendarIds]
  );

  const { events: upcomingEventsRaw } = useGoogleEvents({
    calendarIds: enabledCalendarIdsArray,
    timeMin: upcomingDateRange.timeMin,
    timeMax: upcomingDateRange.timeMax,
    enabled:
      isConnected &&
      calendars &&
      calendars.length > 0 &&
      enabledCalendarIds.size > 0,
  });

  const filteredUpcomingEvents = useMemo(
    () =>
      filterEventsByCalendars(
        upcomingEventsRaw,
        enabledCalendarIds,
        calendars || []
      ),
    [upcomingEventsRaw, enabledCalendarIds, calendars]
  );

  const upcomingEvents = useMemo(
    () =>
      filterUpcomingEvents(
        filteredUpcomingEvents,
        silverKeyCalendarIdRef.current
      ),
    [filteredUpcomingEvents]
  );

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

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

  const permissionsReady = !permissionsLoading && permissions !== undefined;

  if (!permissionsReady) {
    return (
      <div className="w-full">
        <div className="text-center text-sm text-gray-500">
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
      <EventList
        events={upcomingEvents}
        title="Upcoming Events (Next 7 Days)"
        emptyMessage="No upcoming events"
      />
    </div>
  );
}

