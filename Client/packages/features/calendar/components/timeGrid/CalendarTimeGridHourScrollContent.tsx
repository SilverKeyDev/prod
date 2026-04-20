/* eslint-disable silverkey/no-raw-spacing -- hour grid uses hairline rules (1px), z-index, and time-axis pixel math */
import { color, spacing } from "packages/design-tokens";
import { Box, Text } from "packages/ui/components/primitives";
import { localYOffsetToRoundedMinutesFromMidnight } from "packages/utils/calendar/calendarQuickCreateSnap";
import { dateNow, dayjs } from "packages/utils/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  layoutTimedEventsForColumn,
  partitionCalendarEventsForDay,
} from "@/features/calendar/utils/grid/calendarGridLayout";

import {
  CAL_TIME_GRID_HOUR_LABEL_OFFSET_ABOVE_LINE,
  CAL_TIME_GRID_HOURS,
} from "./calendarTimeGridConstants";
import {
  calendarTimeGridToYmd,
  formatCalendarHourLabel,
} from "./calendarTimeGridFormat";
import { CalendarWeekTimedEventBlock } from "./CalendarWeekTimedEventBlock";

const HOUR_GRID_ROW = 1;

export type CalendarTimeGridHourScrollContentProps = {
  dayDates: Date[];
  events: ExtendedGoogleEvent[];
  calendars: GoogleCalendar[];
  /** Must match all-day + day header rows (CSS grid-template-columns). */
  gridTemplateColumns: string;
  hourRowHeight: number;
  nowMinutes: number;
  showWeekendTint: boolean;
  /** When absent (e.g. client read-only), double-click is a no-op. */
  onWeekTimeSlotDoubleClick?: (payload: { date: Date; minutesFromMidnight: number }) => void;
  weekInteractionEnabled?: boolean;
  weekSelectedEventId?: string | null;
  onWeekEventSelect?: (event: ExtendedGoogleEvent) => void;
  onWeekEventOpenEdit?: (event: ExtendedGoogleEvent) => void;
  onWeekTimeColumnBackgroundPress?: () => void;
  onWeekTimedResizeCommit?: (payload: {
    event: ExtendedGoogleEvent;
    dayKey: string;
    startMin: number;
    endMin: number;
  }) => void;
};

export function CalendarTimeGridHourScrollContent({
  dayDates,
  events,
  calendars,
  gridTemplateColumns,
  hourRowHeight,
  nowMinutes,
  showWeekendTint,
  onWeekTimeSlotDoubleClick,
  weekInteractionEnabled = false,
  weekSelectedEventId = null,
  onWeekEventSelect,
  onWeekEventOpenEdit,
  onWeekTimeColumnBackgroundPress,
  onWeekTimedResizeCommit,
}: CalendarTimeGridHourScrollContentProps) {
  const totalGridHeight = CAL_TIME_GRID_HOURS * hourRowHeight;
  const today = dateNow().startOf("day");
  const nowTop = (nowMinutes / 60) * hourRowHeight;
  const showNowInView = dayDates.some((d) => dayjs(d).isSame(today, "day"));

  const hourRules = Array.from({ length: CAL_TIME_GRID_HOURS * 2 }, (_, i) => {
    const half = i % 2 === 1;
    const h = Math.floor(i / 2);
    const top = h * hourRowHeight + (half ? hourRowHeight / 2 : 0);
    return (
      <Box
        key={i}
        style={{
          position: "absolute" as const,
          left: 0,
          right: 0,
          top,
          height: 1,
          borderBottomWidth: 1,
          borderBottomColor: half ? color("neutral.200") : color("neutral.300"),
          borderStyle: half ? "dotted" : "solid",
        }}
      />
    );
  });

  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns,
        width: "100%",
        minHeight: totalGridHeight,
        backgroundColor: color("neutral.50"),
      }}
    >
      <Box
        style={{
          gridColumn: "2 / -1",
          gridRow: HOUR_GRID_ROW,
          position: "relative" as const,
          zIndex: 0,
          minWidth: 0,
          minHeight: totalGridHeight,
          overflow: "hidden" as const,
          backgroundColor: color("neutral.50"),
        }}
      >
        {hourRules}
      </Box>

      <Box
        style={{
          gridColumn: 1,
          gridRow: HOUR_GRID_ROW,
          zIndex: 1,
          minWidth: 0,
          minHeight: totalGridHeight,
          position: "relative" as const,
          borderRightWidth: 1,
          borderRightColor: color("neutral.200"),
          backgroundColor: color("neutral.50"),
          paddingRight: spacing(2),
          overflow: "visible" as const,
        }}
      >
        {Array.from({ length: CAL_TIME_GRID_HOURS }, (_, h) => (
          <Text
            key={h}
            style={{
              position: "absolute" as const,
              top: Math.max(0, h * hourRowHeight - CAL_TIME_GRID_HOUR_LABEL_OFFSET_ABOVE_LINE),
              right: spacing(1),
              fontSize: 11,
              lineHeight: 13,
              color: color("neutral.600"),
              fontWeight: "600",
              textAlign: "right" as const,
            }}
          >
            {formatCalendarHourLabel(h)}
          </Text>
        ))}
        {showNowInView ? (
          <Box
            style={{
              position: "absolute" as const,
              right: spacing(1),
              top: nowTop - 4,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: color("rose.DEFAULT"),
              zIndex: 4,
              pointerEvents: "none" as const,
            }}
          />
        ) : null}
      </Box>

      {dayDates.map((d, colIdx) => {
        const ymd = calendarTimeGridToYmd(d);
        const isTodayCol = dayjs(d).isSame(today, "day");
        const isLastCol = colIdx === dayDates.length - 1;
        const wk = d.getDay();
        const weekendBg =
          showWeekendTint && (wk === 0 || wk === 6)
            ? { backgroundColor: "rgba(0,0,0,0.03)" }
            : null;
        const { timedSlices } = partitionCalendarEventsForDay(events, ymd);
        const placed = layoutTimedEventsForColumn(timedSlices);
        const colStart = colIdx + 2;

        return (
          <Box
            key={ymd}
            style={{
              gridColumn: colStart,
              gridRow: HOUR_GRID_ROW,
              zIndex: 1,
              minWidth: 0,
              minHeight: totalGridHeight,
              position: "relative" as const,
              borderRightWidth: isLastCol ? 0 : 1,
              borderRightColor: color("neutral.200"),
              overflow: "hidden" as const,
              ...weekendBg,
            }}
          >
            {isTodayCol ? (
              <Box
                style={{
                  position: "absolute" as const,
                  left: 0,
                  right: 0,
                  top: nowTop,
                  height: 2,
                  backgroundColor: color("rose.DEFAULT"),
                  zIndex: 2,
                  pointerEvents: "none" as const,
                }}
              />
            ) : null}

            {onWeekTimeSlotDoubleClick || onWeekTimeColumnBackgroundPress ? (
              <Box
                data-calendar-week-time-column=""
                data-calendar-week-ymd={ymd}
                onPointerDown={(e) => {
                  if (onWeekTimeColumnBackgroundPress && e.target === e.currentTarget) {
                    onWeekTimeColumnBackgroundPress();
                  }
                }}
                onDoubleClick={
                  onWeekTimeSlotDoubleClick
                    ? (e) => {
                        e.preventDefault();
                        const el = e.currentTarget as unknown as HTMLElement;
                        const rect = el.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        const minutes = localYOffsetToRoundedMinutesFromMidnight(
                          y,
                          hourRowHeight,
                          totalGridHeight
                        );
                        onWeekTimeSlotDoubleClick({
                          date: d,
                          minutesFromMidnight: minutes,
                        });
                      }
                    : undefined
                }
                style={{
                  position: "absolute" as const,
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  zIndex: 0,
                }}
              />
            ) : null}

            {placed.map((row) => {
              const ev = row.event as ExtendedGoogleEvent;
              const idStr = row.event.id != null ? String(row.event.id) : "";
              const isSelected = Boolean(
                weekSelectedEventId && idStr.length > 0 && weekSelectedEventId === idStr
              );

              return (
                <CalendarWeekTimedEventBlock
                  key={`${row.event.id ?? "ev"}-${row.startMin}-${row.laneIndex}`}
                  row={row}
                  calendars={calendars}
                  hourRowHeight={hourRowHeight}
                  interactionEnabled={weekInteractionEnabled}
                  isSelected={isSelected}
                  onSelect={() => onWeekEventSelect?.(ev)}
                  onOpenEdit={() => onWeekEventOpenEdit?.(ev)}
                  onResizeCommit={
                    onWeekTimedResizeCommit
                      ? (next) =>
                          onWeekTimedResizeCommit({
                            event: ev,
                            dayKey: ymd,
                            startMin: next.startMin,
                            endMin: next.endMin,
                          })
                      : () => {}
                  }
                />
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
