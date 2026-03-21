import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { color, spacing } from "packages/design-tokens";
import { useUserPreferences } from "packages/hooks/data/auth/useUserData";
import { useMediaQuery } from "packages/hooks/ui";
import { useUIStore } from "packages/store";
import type { UIState } from "packages/store/ui.slice";
import Card from "packages/ui/components/cards/Card";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { screenUp } from "packages/ui/types/screens";
import { dateNow, dateParseISO } from "packages/utils/date";

import {
  useCalendarErrorToasts,
  useGoogleCalendarPermissions,
  useGoogleEvents,
} from "@/features/calendar/hooks/data";
import { useGoogleCalendarStoreIntegration } from "@/features/calendar/hooks/store/useGoogleCalendarStoreIntegration";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
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

import { CalendarConnectionPrompt } from "./view/CalendarConnectionPrompt";
import { CalendarMonthViewHeader } from "./view/CalendarMonthViewHeader";
import { EventList } from "./view/EventList";

type CalendarProps = {
  /** Optional section title (e.g. "Calendar") rendered in the header row with month/year and nav */
  sectionTitle?: string;
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

export function Calendar({ sectionTitle }: CalendarProps) {
  const enqueueToast = useUIStore((s: UIState) => s.enqueueToast);
  const {
    isConnected,
    calendars,
    calendarsLoading,
    calendarsError,
    eventsError,
    connectGoogleCalendar,
  } = useGoogleCalendarStoreIntegration();

  useCalendarErrorToasts({ calendarsError, eventsError, enqueueToast });

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
    const { timeMin, timeMax } = calculateCalendarDateRange(monthAnchor.toDate());
    return { timeMin, timeMax };
  }, [monthAnchor]);

  const enabledCalendarIdsArray = useMemo(
    () => Array.from(enabledCalendarIds),
    [enabledCalendarIds]
  );

  const {
    events: rawEvents,
    refreshEvents: refetchEvents,
    updateEvent,
    deleteEvent,
  } = useGoogleEvents({
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
    if (!isConnected) return true;
    if (isConnected && permissions !== null) {
      if (!hasRequiredPermissions || isPartiallyEnabled) return true;
    }
    return false;
  }, [isConnected, permissions, hasRequiredPermissions, isPartiallyEnabled]);

  const permissionsReady = !permissionsLoading && permissions !== undefined;

  if (!permissionsReady) {
    return (
      <Card border="light" className="w-full" padding="md" hover={false}>
        <Text style={{ textAlign: "center", fontSize: 14, color: color("neutral.500") }}>
          Loading calendar permissions…
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

  /** Max width/height ratio (1.5 = width at most 150% of height); min ratio enforced via maxHeight */
  const MAX_ASPECT_RATIO = 1.5;

  const styles = {
    container: {
      width: "100%" as const,
      gap: 0,
      flexDirection: "column" as const,
    },
    weekHeader: {
      display: "flex" as const,
      flexDirection: "row" as const,
      width: "100%" as const,
      flexShrink: 0,
    },
    weekHeaderCell: {
      display: "flex" as const,
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      borderBottomWidth: 1,
      borderColor: color("neutral.200"),
      backgroundColor: color("neutral.50"),
    },
    weekHeaderText: {
      textAlign: "center" as const,
      fontSize: 12,
      fontWeight: "700" as const,
      color: color("neutral.500"),
    },
    grid: {
      display: "flex" as const,
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
    },
    cell: {
      width: cellWidth,
      paddingVertical: 10,
      paddingHorizontal: 4,
      position: "relative" as const,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderColor: color("neutral.200"),
      minHeight: 44,
      maxHeight: 200,
      aspectRatio: MAX_ASPECT_RATIO,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "center" as const,
    },
    cellMuted: { opacity: 0.45 },
    cellSelected: { backgroundColor: "rgba(163, 177, 138, 0.18)" },
    dayNumber: {
      position: "absolute" as const,
      top: spacing(1.5),
      left: spacing(1.5),
      fontSize: 14,
      fontWeight: "700" as const,
      color: color("neutral.800"),
    },
    dayNumberSelected: { color: color("brand.accent") },
    cellContent: {
      marginTop: 26,
      width: "100%" as const,
      minWidth: 0,
      flex: 1,
      alignSelf: "stretch" as const,
      display: "flex" as const,
      flexDirection: "column" as const,
      alignItems: "flex-start" as const,
      justifyContent: "flex-start" as const,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color("brand.accent"),
    },
    eventChip: {
      width: "90%" as const,
      maxWidth: "90%" as const,
      minWidth: 0,
      marginTop: 4,
      marginLeft: spacing(2),
      paddingVertical: 2,
      paddingLeft: spacing(2),
      paddingRight: 4,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: color("brand.accent"),
      backgroundColor: "rgba(163, 177, 138, 0.12)",
      alignSelf: "flex-start" as const,
    },
    eventChipText: {
      fontSize: 10,
      fontWeight: "600" as const,
      color: color("neutral.800"),
      textAlign: "left" as const,
    },
  };

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
          <Box style={styles.weekHeader}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <Box key={d} style={styles.weekHeaderCell}>
                <Text style={styles.weekHeaderText}>{d}</Text>
              </Box>
            ))}
          </Box>

          <Box style={styles.grid}>
            {days.map((d, index) => {
              const rowIndex = Math.floor(index / 7);
              const firstDayOfRow = days[rowIndex * 7];
              const showMonthBorder =
                rowIndex >= 1 && firstDayOfRow.date.getDate() === 1;

              const isSelected = d.key === selectedDayKey;
              const dayEvents = eventsByDay.get(d.key) ?? [];
              const sortedEvents = [...dayEvents].sort((a, b) => {
                const aStart = a.start?.dateTime;
                const bStart = b.start?.dateTime;
                if (!aStart || !bStart) return 0;
                return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
              });
              const visibleEventsInCell = isLargeScreen ? sortedEvents.slice(0, 3) : [];

              return (
                <Pressable
                  key={d.key}
                  onPress={() => setSelectedDayKey(d.key)}
                  style={{
                    ...styles.cell,
                    ...(isLargeScreen && { minHeight: 80 }),
                    ...((!d.isCurrentMonth || d.isPast) && styles.cellMuted),
                    ...(isSelected && styles.cellSelected),
                    ...(showMonthBorder && {
                      borderTopWidth: 2,
                      borderTopColor: color("neutral.300"),
                    }),
                  }}
                >
                  <Text
                    style={{
                      ...styles.dayNumber,
                      ...(isSelected && styles.dayNumberSelected),
                    }}
                  >
                    {d.date.getDate()}
                  </Text>
                  {isLargeScreen ? (
                    <Box style={styles.cellContent}>
                      {visibleEventsInCell.map((ev) => {
                        const startTime = ev.start?.dateTime
                          ? dateParseISO(ev.start.dateTime).toDate().toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })
                          : "";
                        const label = [startTime, ev.summary || "Untitled"]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <Box key={ev.id ?? String(ev)} style={styles.eventChip}>
                            <Text style={styles.eventChipText} numberOfLines={1}>
                              {label}
                            </Text>
                          </Box>
                        );
                      })}
                      {sortedEvents.length > 3 ? (
                        <Box style={{ marginTop: spacing(2), alignSelf: "flex-start" }}>
                          <Text style={{ fontSize: 10, color: color("neutral.500") }}>
                            +{sortedEvents.length - 3} more
                          </Text>
                        </Box>
                      ) : null}
                    </Box>
                  ) : d.count > 0 ? (
                    <Box style={styles.cellContent}>
                      <Box style={styles.dot} />
                    </Box>
                  ) : null}
                </Pressable>
              );
            })}
          </Box>
        </CalendarMonthViewHeader>

        <EventList
          events={selectedEvents}
          emptyMessage="No events for this day"
          silverKeyCalendarId={silverKeyCalendarIdRef.current}
          refreshEvents={refetchEvents}
          updateEvent={updateEvent}
          deleteEvent={deleteEvent}
          calendars={calendars ?? []}
        />
      </Box>
    </Card>
  );
}
