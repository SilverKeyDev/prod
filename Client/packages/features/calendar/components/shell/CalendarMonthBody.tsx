import type { KeyboardEvent, MouseEvent } from "react";

import { color, spacing } from "packages/design-tokens";
import { useFeedGestureTrap } from "packages/hooks/ui";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarColorForEvent,
  hexToRgba,
} from "@/features/calendar/utils/createEventModal/calendarEventColors";
import {
  eventSpansMultipleLocalDays,
  getEventFirstLocalDayKey,
} from "@/features/calendar/utils/parsing/eventParsing";

import type { CalendarMonthGridStyles } from "./calendarMonthGridStyles";

type GridStyles = CalendarMonthGridStyles;

type DayCell = {
  key: string;
  date: Date;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  count: number;
};

type CalendarMonthBodyProps = {
  styles: GridStyles;
  days: DayCell[];
  eventsByDay: Map<string, ExtendedGoogleEvent[]>;
  selectedDayKey: string | null;
  onSelectDay: (key: string) => void;
  onDayNumberPress?: (date: Date) => void;
  onDayDoubleTap?: (date: Date) => void;
  onMonthEventPress?: (event: ExtendedGoogleEvent) => void;
  quickCreateDraftId?: string | null;
  quickCreateDayKey?: string | null;
  isLargeScreen: boolean;
  calendars?: GoogleCalendar[];
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const TOP_BAND = 26;
const BOTTOM_PAD = 8;
const CHIP_STACK = 22;
const MORE_LINE = 16;

function sortDayEvents(dayEvents: ExtendedGoogleEvent[]): ExtendedGoogleEvent[] {
  return [...dayEvents].sort((a, b) => {
    const aStart = a.start?.dateTime ?? a.start?.date;
    const bStart = b.start?.dateTime ?? b.start?.date;
    if (!aStart || !bStart) return 0;
    return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
  });
}

function estimateCellMinHeight(
  d: DayCell,
  sortedEvents: ExtendedGoogleEvent[],
  isLargeScreen: boolean
): number {
  const floor = isLargeScreen ? 52 : 40;
  if (!isLargeScreen) {
    if (d.count === 0) {
      return Math.max(floor, TOP_BAND + BOTTOM_PAD + 6);
    }
    return Math.max(floor, TOP_BAND + BOTTOM_PAD + 14);
  }
  const n = sortedEvents.length;
  if (n === 0) {
    return Math.max(floor, TOP_BAND + BOTTOM_PAD + 6);
  }
  const visible = Math.min(n, 3);
  const more = n > 3 ? MORE_LINE : 0;
  return Math.max(floor, TOP_BAND + visible * CHIP_STACK + more + BOTTOM_PAD);
}

function chunkWeeks(allDays: DayCell[]): DayCell[][] {
  const weeks: DayCell[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}

function MonthDayCell({
  d,
  styles,
  isLargeScreen,
  isSelected,
  isToday,
  isLastInRow,
  showMonthBorder,
  sortedEvents,
  visibleEventsInCell,
  onSelectDay,
  onDayNumberPress,
  onDayDoubleTap,
  onMonthEventPress,
  quickCreateDraftId,
  quickCreateDayKey,
  calendars,
}: {
  d: DayCell;
  styles: GridStyles;
  isLargeScreen: boolean;
  isSelected: boolean;
  isToday: boolean;
  isLastInRow: boolean;
  showMonthBorder: boolean;
  sortedEvents: ExtendedGoogleEvent[];
  visibleEventsInCell: ExtendedGoogleEvent[];
  onSelectDay: (key: string) => void;
  onDayNumberPress?: (date: Date) => void;
  onDayDoubleTap?: (date: Date) => void;
  onMonthEventPress?: (event: ExtendedGoogleEvent) => void;
  quickCreateDraftId?: string | null;
  quickCreateDayKey?: string | null;
  calendars: GoogleCalendar[];
}) {
  const { onTap } = useFeedGestureTrap({
    onSingleTap: () => onSelectDay(d.key),
    onDoubleTap: onDayDoubleTap ? () => onDayDoubleTap(d.date) : () => {},
  });

  const draftAnchor =
    quickCreateDraftId && quickCreateDayKey && d.key === quickCreateDayKey
      ? quickCreateDraftId
      : undefined;

  const dayNum = (
    <Text
      style={{
        ...styles.dayNumber,
        ...(isToday ? styles.dayNumberOnTodayCircle : null),
      }}
    >
      {d.date.getDate()}
    </Text>
  );

  return (
    <Box
      style={{
        ...styles.cell,
        ...(isLastInRow ? styles.cellLastInRow : null),
        ...((!d.isCurrentMonth || d.isPast) && styles.cellMuted),
        ...(isSelected && styles.cellSelected),
        ...(showMonthBorder && {
          borderTopWidth: 2,
          borderTopColor: color("neutral.300"),
        }),
      }}
    >
      <Pressable
        onPress={() => onDayNumberPress?.(d.date)}
        label={`Jump to ${d.date.toDateString()}`}
        style={{
          position: "absolute" as const,
          zIndex: 2,
          top: spacing(1.5),
          left: spacing(1.5),
          minWidth: spacing(7),
          minHeight: spacing(7),
          alignItems: "center" as const,
          justifyContent: "center" as const,
        }}
      >
        {isToday ? <Box style={styles.dayNumberCircle}>{dayNum}</Box> : dayNum}
      </Pressable>

      <Pressable
        data-calendar-month-day={d.key}
        {...(draftAnchor ? { "data-calendar-month-draft-anchor": draftAnchor } : {})}
        onPress={onTap}
        style={{
          flex: 1,
          marginTop: spacing(6.5),
          width: "100%" as const,
          minHeight: spacing(5),
        }}
      >
        {isLargeScreen ? (
          <Box style={styles.cellContent}>
            {visibleEventsInCell.map((ev) => {
              const isMultiDay = eventSpansMultipleLocalDays(ev);
              const firstDayKey = getEventFirstLocalDayKey(ev);
              const isContinuation = Boolean(
                isMultiDay && firstDayKey !== null && d.key !== firstDayKey
              );

              let label: string;
              if (isContinuation) {
                label = `→ · ${ev.summary || "Untitled"}`;
              } else if (ev.start?.dateTime) {
                const startTime = dateParseISO(ev.start.dateTime)
                  .toDate()
                  .toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  });
                label = [startTime, ev.summary || "Untitled"].filter(Boolean).join(" · ");
              } else if (isMultiDay) {
                label = `All day · ${ev.summary || "Untitled"}`;
              } else {
                label = ev.summary || "Untitled";
              }

              const eventColor = isContinuation
                ? color("neutral.500")
                : calendarColorForEvent(ev, calendars);

              const chipStyle = {
                ...styles.eventChip,
                ...(!isContinuation ? { backgroundColor: hexToRgba(eventColor, 0.18) } : null),
                ...(isMultiDay && !isContinuation ? styles.eventChipMultiDay : null),
                ...(isContinuation ? styles.eventChipMultiDayContinuation : null),
              };

              return (
                <Box
                  key={ev.id ?? String(ev)}
                  data-calendar-month-event=""
                  {...(ev.id != null && String(ev.id).length > 0
                    ? {
                        "data-calendar-month-event-id": String(ev.id),
                      }
                    : {})}
                  onClick={(e: MouseEvent) => {
                    e.stopPropagation();
                    onMonthEventPress?.(ev);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onMonthEventPress?.(ev);
                    }
                  }}
                  style={chipStyle}
                >
                  <Box style={{ ...styles.eventChipDot, backgroundColor: eventColor }} />
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
    </Box>
  );
}

export function CalendarMonthBody({
  styles,
  days,
  eventsByDay,
  selectedDayKey,
  onSelectDay,
  onDayNumberPress,
  onDayDoubleTap,
  onMonthEventPress,
  quickCreateDraftId,
  quickCreateDayKey,
  isLargeScreen,
  calendars = [],
}: CalendarMonthBodyProps) {
  const weeks = chunkWeeks(days);

  return (
    <>
      <Box style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <Box key={d} style={styles.weekHeaderCell}>
            <Text style={styles.weekHeaderText}>{d}</Text>
          </Box>
        ))}
      </Box>

      {weeks.map((weekDays, rowIndex) => {
        const firstDayOfRow = weekDays[0];
        const showMonthBorder = rowIndex >= 1 && firstDayOfRow.date.getDate() === 1;

        const rowMinHeight = Math.max(
          ...weekDays.map((d) => {
            const dayEvents = eventsByDay.get(d.key) ?? [];
            return estimateCellMinHeight(d, sortDayEvents(dayEvents), isLargeScreen);
          })
        );

        return (
          <Box key={`week-${rowIndex}`} style={{ ...styles.weekRow, minHeight: rowMinHeight }}>
            {weekDays.map((d, colIndex) => {
              const isSelected = d.key === selectedDayKey;
              const isToday = d.isToday;
              const dayEvents = eventsByDay.get(d.key) ?? [];
              const sortedEvents = sortDayEvents(dayEvents);
              const visibleEventsInCell = isLargeScreen ? sortedEvents.slice(0, 3) : [];

              return (
                <MonthDayCell
                  key={d.key}
                  d={d}
                  styles={styles}
                  isLargeScreen={isLargeScreen}
                  isSelected={isSelected}
                  isToday={isToday}
                  isLastInRow={colIndex === weekDays.length - 1}
                  showMonthBorder={showMonthBorder}
                  sortedEvents={sortedEvents}
                  visibleEventsInCell={visibleEventsInCell}
                  onSelectDay={onSelectDay}
                  onDayNumberPress={onDayNumberPress}
                  onDayDoubleTap={onDayDoubleTap}
                  onMonthEventPress={onMonthEventPress}
                  quickCreateDraftId={quickCreateDraftId}
                  quickCreateDayKey={quickCreateDayKey}
                  calendars={calendars}
                />
              );
            })}
          </Box>
        );
      })}
    </>
  );
}
