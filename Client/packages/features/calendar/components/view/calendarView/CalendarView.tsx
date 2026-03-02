import { useEffect, useMemo, useRef, useState } from "react";

import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import type { DateRange } from "packages/schemas/calendar";
import type { FreebusyTimeBlock } from "packages/schemas/scheduling";
import { dateParseISO } from "packages/utils/date";

import Card from "@/components/layout/Card.web";
import { useGoogleEvents } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import {
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "@/features/calendar/utils/calendar";
import { calculateCalendarDateRange, getVisibleDateRange } from "@/features/calendar/utils/date";
import { filterCurrentPeriodEvents } from "@/features/calendar/utils/eventFiltering";

import { CalendarGrid } from "./CalendarGrid";
import type { CalendarViewProps } from "./types";
import { WeekDayHeaders } from "./WeekDayHeaders";

export function CalendarView({
  currentDate,
  availability,
  onDateClick,
  silverKeyCalendarId,
  onVisibleDatesChange,
}: CalendarViewProps) {
  const { isConnected, calendars } = useGoogleCalendarStoreIntegration();
  const { userPreferences } = useUserPreferences();

  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(new Set());
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");

  useEffect(() => {
    if (!calendars || calendars.length === 0) {
      return;
    }

    const calendarsKey = getCalendarsKey(calendars);
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;

    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);

    const silverKeyCalendar = findSilverKeyCalendar(calendars);
    const silverKeyCalendarIdValue = silverKeyCalendar?.id || silverKeyCalendarId || null;

    if (!initializedFromPreferencesRef.current || calendarsChanged) {
      const enabledSet = initializeEnabledCalendars(
        calendars,
        hasDisabledCalendars ? disabledCalendars : undefined,
        silverKeyCalendarIdValue
      );
      setEnabledCalendarIds(enabledSet);
      initializedFromPreferencesRef.current = true;
      lastCalendarsRef.current = calendarsKey;
    }
  }, [calendars, userPreferences, silverKeyCalendarId]);

  const dateRange: DateRange = useMemo(() => {
    return calculateCalendarDateRange(currentDate);
  }, [currentDate]);

  const { events: allEvents } = useGoogleEvents({
    calendarIds: Array.from(enabledCalendarIds),
    timeMin: dateRange.timeMin,
    timeMax: dateRange.timeMax,
    enabled: isConnected && !!calendars?.length && enabledCalendarIds.size > 0,
  });

  const events = useMemo(() => {
    return filterCurrentPeriodEvents(allEvents, currentDate);
  }, [allEvents, currentDate]);

  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ExtendedGoogleEvent[]> = {};
    events.forEach((event) => {
      try {
        const eventStart = event.start?.dateTime ?? event.start?.date;
        if (!eventStart) return;
        const eventDate = dateParseISO(eventStart);
        const dateKey = eventDate.format("YYYY-MM-DD");
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(event);
      } catch {
        // Skip invalid dates
      }
    });
    return grouped;
  }, [events]);

  const availabilityByDate = useMemo(() => {
    if (!availability) return {};
    const grouped: Record<string, FreebusyTimeBlock[]> = {};
    availability.forEach((block) => {
      try {
        const blockStart = dateParseISO(block.start);
        const dateKey = blockStart.format("YYYY-MM-DD");
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(block);
      } catch {
        // Skip invalid dates
      }
    });
    return grouped;
  }, [availability]);

  const calendarGrid = useMemo(() => {
    const { gridDays } = getVisibleDateRange(currentDate, "month");
    if (!gridDays) return [];
    return gridDays.map((day) => {
      const dateKey = day.date.toISOString().split("T")[0];
      return {
        ...day,
        events: eventsByDate[dateKey] || [],
        availability: availabilityByDate[dateKey] || [],
      };
    });
  }, [currentDate, eventsByDate, availabilityByDate]);

  const visibleDateRange = useMemo(() => {
    const { start, end } = getVisibleDateRange(currentDate);
    return { firstDate: start, lastDate: end };
  }, [currentDate]);

  const lastNotifiedDatesRef = useRef<{ firstDate: Date; lastDate: Date } | null>(null);

  useEffect(() => {
    if (!onVisibleDatesChange || !visibleDateRange) return;
    const { firstDate, lastDate } = visibleDateRange;
    const lastNotified = lastNotifiedDatesRef.current;
    if (
      !lastNotified ||
      firstDate.getTime() !== lastNotified.firstDate.getTime() ||
      lastDate.getTime() !== lastNotified.lastDate.getTime()
    ) {
      lastNotifiedDatesRef.current = { firstDate, lastDate };
      onVisibleDatesChange(firstDate, lastDate);
    }
  }, [visibleDateRange, onVisibleDatesChange]);

  return (
    <Card padding="md" className="w-full overflow-hidden">
      <WeekDayHeaders />
      <CalendarGrid
        calendarGrid={calendarGrid}
        onDateClick={onDateClick}
        silverKeyCalendarId={silverKeyCalendarId}
        showAvailability={!!availability}
      />
    </Card>
  );
}
