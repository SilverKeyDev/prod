import { color, spacing } from "packages/design-tokens";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import type { CalendarMonthGridStyles } from "./calendarMonthGridStyles";

type GridStyles = CalendarMonthGridStyles;

type DayCell = {
  key: string;
  date: Date;
  isCurrentMonth: boolean;
  isPast: boolean;
  count: number;
};

type CalendarMonthBodyProps = {
  styles: GridStyles;
  days: DayCell[];
  eventsByDay: Map<string, ExtendedGoogleEvent[]>;
  selectedDayKey: string;
  onSelectDay: (key: string) => void;
  isLargeScreen: boolean;
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function CalendarMonthBody({
  styles,
  days,
  eventsByDay,
  selectedDayKey,
  onSelectDay,
  isLargeScreen,
}: CalendarMonthBodyProps) {
  return (
    <>
      <Box style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <Box key={d} style={styles.weekHeaderCell}>
            <Text style={styles.weekHeaderText}>{d}</Text>
          </Box>
        ))}
      </Box>

      <Box style={styles.grid}>
        {days.map((d, index) => {
          const rowIndex = Math.floor(index / 7);
          const firstDayOfRow = days[rowIndex * 7];
          const showMonthBorder = rowIndex >= 1 && firstDayOfRow.date.getDate() === 1;

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
              onPress={() => onSelectDay(d.key)}
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
                    const label = [startTime, ev.summary || "Untitled"].filter(Boolean).join(" · ");
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
    </>
  );
}
