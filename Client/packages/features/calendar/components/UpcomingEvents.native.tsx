import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { View } from "react-native";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { Text } from "packages/ui/components/primitives/text";
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

export function UpcomingEvents() {
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

  useEffect(() => {
    if (!calendars || calendars.length === 0) return;

    const calendarsKey = getCalendarsKey(calendars);
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;

    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);
    const disabledCalendarsJustLoaded = !hadDisabledCalendarsRef.current && hasDisabledCalendars;

    if (hasDisabledCalendars) hadDisabledCalendarsRef.current = true;

    const silverKeyCalendar = findSilverKeyCalendar(calendars);
    if (silverKeyCalendar) silverKeyCalendarIdRef.current = silverKeyCalendar.id;

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
    if (!isConnected) return true;
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) return true;
    }
    return false;
  }, [isConnected, permissions, hasRequiredPermissions, isPartiallyEnabled]);

  const permissionsReady = !permissionsLoading && permissions !== undefined;

  if (!permissionsReady) {
    return (
      <View>
        <Text className="text-center text-sm text-gray-500">Loading calendar permissions…</Text>
      </View>
    );
  }

  if (shouldShowConnectionPrompt) {
    return <CalendarConnectionPrompt onConnect={handleConnect} isLoading={calendarsLoading} />;
  }

  return (
    <EventList
      events={upcomingEvents}
      title="Upcoming Events (Next 7 Days)"
      emptyMessage="No upcoming events"
    />
  );
}
