import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { color, spacing } from "packages/design-tokens";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useMediaQuery } from "packages/hooks/ui";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import Card from "packages/ui/components/cards/Card";
import { Box, Text } from "packages/ui/components/primitives";
import { screenUp } from "packages/ui/types/screens";
import { dateNow } from "packages/utils/date";

import {
  useCalendarErrorToasts,
  useClientCalendarEventsQuery,
  useGoogleCalendarPermissions,
  useGoogleEvents,
} from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  filterCalendarsToAgentOwned,
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "@/features/calendar/utils/calendar";
import {
  calculateCalendarDateRange,
  formatDateRange,
  getVisibleDateRange,
} from "@/features/calendar/utils/date";
import { filterEventsByCalendars } from "@/features/calendar/utils/eventFiltering";
import { getEventStartDate } from "@/features/calendar/utils/eventParsing";

import { CalendarMonthBody } from "./CalendarMonthBody";
import { buildCalendarMonthGridStyles } from "./calendarMonthGridStyles";
import { CalendarConnectionPrompt } from "./view/CalendarConnectionPrompt";
import { CalendarMonthViewHeader } from "./view/CalendarMonthViewHeader";
import { EventList } from "./view/EventList";

type CalendarProps = {
  /** Optional section title (e.g. "Calendar") rendered in the header row with month/year and nav */
  sectionTitle?: string;
  /** Agent client hub: show this client’s Google Calendar events only (via server proxy). */
  clientUserId?: string;
  /** Agent dashboard: only calendars the user owns (not shared-in / subscription feeds). */
  ownedCalendarsOnly?: boolean;
};

function toDateKey(d: Date) {
  try {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}

export function Calendar({
  sectionTitle,
  clientUserId,
  ownedCalendarsOnly = false,
}: CalendarProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    eventsError,
    connectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  const isClientView = Boolean(clientUserId);

  const scopedCalendars = useMemo(() => {
    if (isClientView) {
      return calendars ?? [];
    }
    if (!ownedCalendarsOnly || !calendars?.length) {
      return calendars ?? [];
    }
    return filterCalendarsToAgentOwned(calendars);
  }, [calendars, ownedCalendarsOnly, isClientView]);

  useCalendarErrorToasts({
    calendarsError: isClientView ? null : calendarsError,
    eventsError: isClientView ? null : eventsError,
    enqueueToast,
  });

  const { userPreferences } = useUserPreferences();
  const { permissionsLoading, hasRequiredPermissions, isPartiallyEnabled, permissions } =
    useGoogleCalendarPermissions();

  const [enabledCalendarIds, setEnabledCalendarIds] = useState<Set<string>>(() => new Set());
  const silverKeyCalendarIdRef = useRef<string | null>(null);
  const initializedFromPreferencesRef = useRef(false);
  const lastCalendarsRef = useRef<string>("");
  const hadDisabledCalendarsRef = useRef(false);

  const [monthAnchor, setMonthAnchor] = useState(() =>
    dateNow().subtract(dateNow().day(), "day").startOf("day")
  );
  const [selectedDayKey, setSelectedDayKey] = useState(() => toDateKey(dateNow().toDate()));

  const isLargeScreen = useMediaQuery(screenUp("md"));

  useEffect(() => {
    if (isClientView) {
      return;
    }
    if (!scopedCalendars || scopedCalendars.length === 0) {
      return;
    }

    const calendarsKey = getCalendarsKey(scopedCalendars);
    const calendarsChanged = lastCalendarsRef.current !== calendarsKey;

    const disabledCalendars = userPreferences?.disabled_calendars;
    const hasDisabledCalendars = Array.isArray(disabledCalendars);
    const disabledCalendarsJustLoaded = !hadDisabledCalendarsRef.current && hasDisabledCalendars;
    if (hasDisabledCalendars) hadDisabledCalendarsRef.current = true;

    const silverKeyCalendar = findSilverKeyCalendar(scopedCalendars);
    if (silverKeyCalendar) silverKeyCalendarIdRef.current = silverKeyCalendar.id;

    if (!initializedFromPreferencesRef.current || calendarsChanged || disabledCalendarsJustLoaded) {
      const enabledSet = initializeEnabledCalendars(
        scopedCalendars,
        hasDisabledCalendars ? disabledCalendars : undefined,
        silverKeyCalendarIdRef.current
      );
      setEnabledCalendarIds(enabledSet);
      initializedFromPreferencesRef.current = true;
      lastCalendarsRef.current = calendarsKey;
    }
  }, [scopedCalendars, userPreferences, isClientView]);

  const range = useMemo(() => {
    const { timeMin, timeMax } = calculateCalendarDateRange(monthAnchor.toDate());
    return { timeMin, timeMax };
  }, [monthAnchor]);

  const enabledCalendarIdsArray = useMemo(
    () => Array.from(enabledCalendarIds),
    [enabledCalendarIds]
  );

  const {
    events: rawSelfEvents,
    refreshEvents: refetchEvents,
    updateEvent,
    deleteEvent,
  } = useGoogleEvents({
    calendarIds: enabledCalendarIdsArray,
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    enabled:
      !isClientView && isConnected && scopedCalendars.length > 0 && enabledCalendarIds.size > 0,
  });

  const clientEventsQuery = useClientCalendarEventsQuery(
    isClientView ? clientUserId! : null,
    range.timeMin,
    range.timeMax,
    "primary"
  );

  const rawEvents = useMemo((): ExtendedGoogleEvent[] => {
    if (isClientView) {
      return (clientEventsQuery.data ?? []).map((e) => ({
        ...e,
        calendarId: "primary",
        isClientEvent: true as const,
      }));
    }
    return rawSelfEvents;
  }, [isClientView, clientEventsQuery.data, rawSelfEvents]);

  const visibleEvents = useMemo(() => {
    if (isClientView) {
      return rawEvents;
    }
    return filterEventsByCalendars(rawEvents, enabledCalendarIds, scopedCalendars);
  }, [isClientView, rawEvents, enabledCalendarIds, scopedCalendars]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ExtendedGoogleEvent[]>();
    for (const ev of visibleEvents) {
      const start = getEventStartDate(ev);
      if (!start) continue;
      const key = toDateKey(start);
      if (!key) continue;
      const arr = map.get(key);
      if (arr) arr.push(ev);
      else map.set(key, [ev]);
    }
    return map;
  }, [visibleEvents]);

  const days = useMemo(() => {
    const { gridDays } = getVisibleDateRange(monthAnchor.toDate(), "month");
    if (!gridDays) return [];
    return gridDays.map((day) => {
      const key = toDateKey(day.date);
      const count = key ? (eventsByDay.get(key)?.length ?? 0) : 0;
      return {
        key,
        date: day.date,
        isCurrentMonth: day.isCurrentMonth,
        isPast: day.isPast,
        count,
      };
    });
  }, [monthAnchor, eventsByDay]);

  const selectedEvents = useMemo(() => {
    return selectedDayKey ? (eventsByDay.get(selectedDayKey) ?? []) : [];
  }, [eventsByDay, selectedDayKey]);

  const visibleRangeLabel = useMemo(() => {
    const { start, end } = getVisibleDateRange(monthAnchor.toDate());
    return formatDateRange(start, end);
  }, [monthAnchor]);

  const thisWeekSunday = useMemo(
    () => dateNow().subtract(dateNow().day(), "day").startOf("day"),
    []
  );
  const canGoPrev = monthAnchor.isAfter(thisWeekSunday);

  const handlePrev = useCallback(() => {
    setMonthAnchor((prev) => {
      const next = prev.subtract(5, "week");
      return next.isBefore(thisWeekSunday) ? thisWeekSunday : next;
    });
  }, [thisWeekSunday]);

  const handleNext = useCallback(() => {
    setMonthAnchor((prev) => prev.add(5, "week"));
  }, []);

  const handleConnect = useCallback(() => {
    connectGoogleCalendar();
  }, [connectGoogleCalendar]);

  const shouldShowConnectionPrompt = useMemo(() => {
    if (isClientView) {
      return false;
    }
    if (!isConnected) return true;
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) return true;
    }
    return false;
  }, [isClientView, isConnected, permissions, hasRequiredPermissions, isPartiallyEnabled]);

  const permissionsReady = isClientView || (!permissionsLoading && permissions !== undefined);

  if (!permissionsReady) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text style={{ textAlign: "center", fontSize: 14, color: color("neutral.500") }}>
          Loading calendar permissions…
        </Text>
      </Card>
    );
  }

  if (isClientView && clientEventsQuery.isLoading) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text style={{ textAlign: "center", fontSize: 14, color: color("neutral.500") }}>
          Loading client calendar…
        </Text>
      </Card>
    );
  }

  if (isClientView && clientEventsQuery.isError) {
    const message =
      clientEventsQuery.error instanceof Error
        ? clientEventsQuery.error.message
        : "Could not load this client’s calendar.";
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text style={{ textAlign: "center", fontSize: 14, color: color("neutral.500") }}>
          {message}
        </Text>
      </Card>
    );
  }

  if (shouldShowConnectionPrompt) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <CalendarConnectionPrompt onConnect={handleConnect} isLoading={calendarsLoading} />
      </Card>
    );
  }

  const cellWidth = `${100 / 7}%` as const;
  const styles = buildCalendarMonthGridStyles(cellWidth, spacing);

  return (
    <Card border="none" className="w-full" padding="none" hover={false}>
      <Box style={styles.container}>
        <CalendarMonthViewHeader
          sectionTitle={sectionTitle}
          monthLabel={visibleRangeLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          disabledPrev={!canGoPrev}
        >
          <CalendarMonthBody
            styles={styles}
            days={days}
            eventsByDay={eventsByDay}
            selectedDayKey={selectedDayKey}
            onSelectDay={setSelectedDayKey}
            isLargeScreen={isLargeScreen}
          />
        </CalendarMonthViewHeader>

        <EventList
          events={selectedEvents}
          emptyMessage="No events for this day"
          silverKeyCalendarId={isClientView ? null : silverKeyCalendarIdRef.current}
          refreshEvents={
            isClientView
              ? async () => {
                  await clientEventsQuery.refetch();
                }
              : refetchEvents
          }
          updateEvent={isClientView ? undefined : updateEvent}
          deleteEvent={isClientView ? undefined : deleteEvent}
          calendars={isClientView ? [] : scopedCalendars}
        />
      </Box>
    </Card>
  );
}
