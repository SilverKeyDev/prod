import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import Card from "packages/ui/components/cards/Card";
import { Box, Text } from "packages/ui/components/primitives";
import { dateNow, dayjs } from "packages/utils/date";

import { useGoogleCalendarPermissions, useGoogleEvents } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import {
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "@/features/calendar/utils/calendar";
import {
  filterEventsByCalendars,
  filterUpcomingEvents,
} from "@/features/calendar/utils/eventFiltering";

import { CalendarConnectionPrompt } from "./view/CalendarConnectionPrompt";
import { EventList } from "./view/EventList";

type UpcomingEventsProps = {
  /** When true, EventList renders without FlatList (for use inside another VirtualizedList). */
  embedInListHeader?: boolean;
};

export function UpcomingEvents({ embedInListHeader = false }: UpcomingEventsProps = {}) {
  const { isConnected, calendars, calendarsLoading, connectGoogleCalendar } =
    useGoogleCalendarStoreIntegration();

  const { userPreferences } = useUserPreferences();

  const { permissionsLoading, hasRequiredPermissions, isPartiallyEnabled, permissions } =
    useGoogleCalendarPermissions();

  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(() => new Set());

  const silverKeyCalendarIdRef = useRef<string | null>(null);
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");
  const hadDisabledCalendarsRef = useRef(false);

  // Recalculate daily to ensure our "next 7 days" window stays current
  const [todayDateString, setTodayDateString] = useState(() => dateNow().format("ddd MMM DD YYYY"));
  const lastCheckedDateRef = useRef<string>(todayDateString);

  useEffect(() => {
    const checkDate = () => {
      const currentDateString = dateNow().format("ddd MMM DD YYYY");
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
    const disabledCalendarsJustLoaded = !hadDisabledCalendarsRef.current && hasDisabledCalendars;

    if (hasDisabledCalendars) {
      hadDisabledCalendarsRef.current = true;
    }

    const silverKeyCalendar = findSilverKeyCalendar(calendars);
    if (silverKeyCalendar) {
      silverKeyCalendarIdRef.current = silverKeyCalendar.id;
    }

    if (!initializedFromPreferencesRef.current || calendarsChanged || disabledCalendarsJustLoaded) {
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
    const parsed = todayDateString ? dayjs(todayDateString, "ddd MMM DD YYYY") : null;
    const todayStart =
      parsed?.isValid() && parsed ? parsed.startOf("day") : dateNow().startOf("day");
    const nextWeek = todayStart.add(7, "day").endOf("day");
    return {
      timeMin: todayStart.toISOString(),
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
    enabled: isConnected && calendars && calendars.length > 0 && enabledCalendarIds.size > 0,
  });

  const filteredUpcomingEvents = useMemo(
    () => filterEventsByCalendars(upcomingEventsRaw, enabledCalendarIds, calendars || []),
    [upcomingEventsRaw, enabledCalendarIds, calendars]
  );

  const upcomingEvents = useMemo(
    () => filterUpcomingEvents(filteredUpcomingEvents, silverKeyCalendarIdRef.current),
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
      <Card border="charcoal" className="mt-4 w-full" padding="sm" hover={false}>
        <Text className="text-text-secondary text-center text-sm">
          Loading calendar permissions...
        </Text>
      </Card>
    );
  }

  if (shouldShowConnectionPrompt) {
    return (
      <Card border="charcoal" className="mt-4 w-full" padding="sm" hover={false}>
        <CalendarConnectionPrompt onConnect={handleConnect} isLoading={calendarsLoading} />
      </Card>
    );
  }

  return (
    <Box className="mt-4 w-full">
      <EventList
        events={upcomingEvents}
        title="Upcoming Events (Next 7 Days)"
        emptyMessage="No upcoming events"
        embedInListHeader={embedInListHeader}
      />
    </Box>
  );
}
