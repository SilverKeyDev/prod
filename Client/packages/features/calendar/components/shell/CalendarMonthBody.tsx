import type { KeyboardEvent, MouseEvent } from "react";

import { color, spacing } from "packages/design-tokens";
import { useFeedGestureTrap } from "packages/hooks/ui";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
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
};

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function MonthDayCell({
  d,
  styles,
  isLargeScreen,
  isSelected,
  showMonthBorder,
  sortedEvents,
  visibleEventsInCell,
  onSelectDay,
  onDayNumberPress,
  onDayDoubleTap,
  onMonthEventPress,
  quickCreateDraftId,
  quickCreateDayKey,
}: {
  d: DayCell;
  styles: GridStyles;
  isLargeScreen: boolean;
  isSelected: boolean;
  showMonthBorder: boolean;
  sortedEvents: ExtendedGoogleEvent[];
  visibleEventsInCell: ExtendedGoogleEvent[];
  onSelectDay: (key: string) => void;
  onDayNumberPress?: (date: Date) => void;
  onDayDoubleTap?: (date: Date) => void;
  onMonthEventPress?: (event: ExtendedGoogleEvent) => void;
  quickCreateDraftId?: string | null;
  quickCreateDayKey?: string | null;
}) {
  const { onTap } = useFeedGestureTrap({
    onSingleTap: () => onSelectDay(d.key),
    onDoubleTap: onDayDoubleTap ? () => onDayDoubleTap(d.date) : () => {},
  });

  const draftAnchor =
    quickCreateDraftId && quickCreateDayKey && d.key === quickCreateDayKey
      ? quickCreateDraftId
      : undefined;

  return (
    <Box
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
        <Text
          style={{
            ...styles.dayNumber,
            position: "relative" as const,
            top: spacing(0),
            left: spacing(0),
            ...(isSelected && styles.dayNumberSelected),
          }}
        >
          {d.date.getDate()}
        </Text>
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

              const chipStyle = {
                ...styles.eventChip,
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
            const aStart = a.start?.dateTime ?? a.start?.date;
            const bStart = b.start?.dateTime ?? b.start?.date;
            if (!aStart || !bStart) return 0;
            return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
          });
          const visibleEventsInCell = isLargeScreen ? sortedEvents.slice(0, 3) : [];

          return (
            <MonthDayCell
              key={d.key}
              d={d}
              styles={styles}
              isLargeScreen={isLargeScreen}
              isSelected={isSelected}
              showMonthBorder={showMonthBorder}
              sortedEvents={sortedEvents}
              visibleEventsInCell={visibleEventsInCell}
              onSelectDay={onSelectDay}
              onDayNumberPress={onDayNumberPress}
              onDayDoubleTap={onDayDoubleTap}
              onMonthEventPress={onMonthEventPress}
              quickCreateDraftId={quickCreateDraftId}
              quickCreateDayKey={quickCreateDayKey}
            />
          );
        })}
      </Box>
    </>
  );
}
