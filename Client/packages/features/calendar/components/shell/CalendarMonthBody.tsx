import { Box, Text } from "packages/ui/components/primitives";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { CalendarMonthGridStyles } from "@/features/calendar/components/shell/calendarMonthGridStyles";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import {
  chunkWeeks,
  estimateCellMinHeight,
  type MonthBodyDayCell,
  sortDayEvents,
  WEEK_DAYS,
} from "./calendarMonthBody/calendarMonthBodyModel";
import { CalendarMonthDayCell } from "./calendarMonthBody/CalendarMonthDayCell";

type GridStyles = CalendarMonthGridStyles;

type CalendarMonthBodyProps = {
  styles: GridStyles;
  days: MonthBodyDayCell[];
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
                <CalendarMonthDayCell
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
