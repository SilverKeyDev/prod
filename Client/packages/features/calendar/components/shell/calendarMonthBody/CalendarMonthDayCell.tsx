import type { KeyboardEvent, MouseEvent } from "react";

import { color, spacing } from "packages/design-tokens";
import { useFeedGestureTrap } from "packages/hooks/ui";
import { Box, Pressable, Text } from "packages/ui/components/primitives";
import { dateParseISO } from "packages/utils/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { CalendarMonthGridStyles } from "@/features/calendar/components/shell/calendarMonthGridStyles";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarColorForEvent,
  hexToRgba,
} from "@/features/calendar/utils/createEventModal/calendarEventColors";
import {
  eventSpansMultipleLocalDays,
  getEventFirstLocalDayKey,
} from "@/features/calendar/utils/parsing/eventParsing";

import type { MonthBodyDayCell } from "./calendarMonthBodyModel";

type GridStyles = CalendarMonthGridStyles;

export function CalendarMonthDayCell({
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
  d: MonthBodyDayCell;
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
