import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { color } from "packages/design-tokens";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import type { ExtendedGoogleEvent } from "packages/schemas/calendar";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateNow } from "packages/utils/date";

import { useGoogleCalendarPermissions, useGoogleEvents } from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import {
  findSilverKeyCalendar,
  getCalendarsKey,
  initializeEnabledCalendars,
} from "@/features/calendar/utils/calendar";
import { filterEventsByCalendars } from "@/features/calendar/utils/eventFiltering";
import { getEventStartDate } from "@/features/calendar/utils/eventParsing";

import { CalendarConnectionPrompt } from "./view/CalendarConnectionPrompt";
import { EventList } from "./view/EventList";

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

export function Calendar() {
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

  const [monthAnchor, setMonthAnchor] = useState(() => dateNow().startOf("month"));
  const [selectedDayKey, setSelectedDayKey] = useState(() => toDateKey(dateNow().toDate()));

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

  const range = useMemo(() => {
    const start = monthAnchor.startOf("month").startOf("week");
    const end = monthAnchor.endOf("month").endOf("week");
    return { timeMin: start.toISOString(), timeMax: end.toISOString() };
  }, [monthAnchor]);

  const enabledCalendarIdsArray = useMemo(
    () => Array.from(enabledCalendarIds),
    [enabledCalendarIds]
  );

  const { events: rawEvents } = useGoogleEvents({
    calendarIds: enabledCalendarIdsArray,
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    enabled: isConnected && calendars && calendars.length > 0 && enabledCalendarIds.size > 0,
  });

  const visibleEvents = useMemo(() => {
    return filterEventsByCalendars(rawEvents, enabledCalendarIds, calendars || []);
  }, [rawEvents, enabledCalendarIds, calendars]);

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
    const start = monthAnchor.startOf("month").startOf("week");
    const end = monthAnchor.endOf("month").endOf("week");
    const out: {
      key: string;
      date: Date;
      isCurrentMonth: boolean;
      count: number;
    }[] = [];
    let cursor = start;
    while (cursor.isBefore(end) || cursor.isSame(end, "day")) {
      const date = cursor.toDate();
      const key = toDateKey(date);
      const isCurrentMonth = cursor.month() === monthAnchor.month();
      const count = key ? (eventsByDay.get(key)?.length ?? 0) : 0;
      out.push({ key, date, isCurrentMonth, count });
      cursor = cursor.add(1, "day");
    }
    return out;
  }, [monthAnchor, eventsByDay]);

  const selectedEvents = useMemo(() => {
    return selectedDayKey ? (eventsByDay.get(selectedDayKey) ?? []) : [];
  }, [eventsByDay, selectedDayKey]);

  const handlePrev = useCallback(() => {
    setMonthAnchor((prev) => prev.subtract(1, "month").startOf("month"));
  }, []);

  const handleNext = useCallback(() => {
    setMonthAnchor((prev) => prev.add(1, "month").startOf("month"));
  }, []);

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
      <Box style={{ width: "100%" }}>
        <Text style={{ textAlign: "center", fontSize: 14, color: color("neutral.500") }}>
          Loading calendar permissions…
        </Text>
      </Box>
    );
  }

  if (shouldShowConnectionPrompt) {
    return <CalendarConnectionPrompt onConnect={handleConnect} isLoading={calendarsLoading} />;
  }

  const styles = {
    container: { width: "100%" as const, gap: 14 },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "800" as const,
      color: color("neutral.900"),
    },
    navBtn: {
      width: 38,
      height: 38,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: color("neutral.200"),
      backgroundColor: color("neutral.50"),
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    navBtnText: {
      fontSize: 22,
      fontWeight: "800" as const,
      color: color("neutral.800"),
      lineHeight: 22,
    },
    weekHeader: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
    },
    weekHeaderText: {
      width: `${100 / 7}%` as const,
      textAlign: "center" as const,
      fontSize: 12,
      fontWeight: "700" as const,
      color: color("neutral.500"),
    },
    grid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: color("neutral.200"),
      overflow: "hidden" as const,
      backgroundColor: color("neutral.50"),
    },
    cell: {
      width: `${100 / 7}%` as const,
      paddingVertical: 10,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: color("neutral.200"),
      minHeight: 44,
    },
    cellMuted: { opacity: 0.45 },
    cellSelected: { backgroundColor: "rgba(163, 177, 138, 0.18)" },
    dayNumber: {
      fontSize: 14,
      fontWeight: "700" as const,
      color: color("neutral.800"),
    },
    dayNumberSelected: { color: color("brand.accent") },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 4,
      backgroundColor: color("brand.accent"),
    },
  };

  return (
    <Box style={styles.container}>
      <Box style={styles.header}>
        <Pressable onPress={handlePrev} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{monthAnchor.format("MMMM YYYY")}</Text>
        <Pressable onPress={handleNext} style={styles.navBtn}>
          <Text style={styles.navBtnText}>›</Text>
        </Pressable>
      </Box>

      <Box style={styles.weekHeader}>
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <Text key={d} style={styles.weekHeaderText}>
            {d}
          </Text>
        ))}
      </Box>

      <Box style={styles.grid}>
        {days.map((d) => {
          const isSelected = d.key === selectedDayKey;
          return (
            <Pressable
              key={d.key}
              onPress={() => setSelectedDayKey(d.key)}
              style={[
                styles.cell,
                !d.isCurrentMonth && styles.cellMuted,
                isSelected && styles.cellSelected,
              ]}
            >
              <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                {d.date.getDate()}
              </Text>
              {d.count > 0 ? <Box style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </Box>

      <EventList
        events={selectedEvents}
        title="Events"
        emptyMessage="No events for this day"
        onEventClick={undefined}
      />
    </Box>
  );
}
