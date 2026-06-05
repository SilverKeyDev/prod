/* eslint-disable silverkey/no-raw-spacing -- all-day lane geometry uses CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT and fixed gaps to align with the hour grid */
import { color, spacing } from "packages/design-tokens";
import { Box, Text } from "packages/ui/components/structure/primitives";
import ScrollView from "packages/ui/components/structure/primitives/scroll/ScrollView";
import { dateNow, dayjs } from "packages/utils/core/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarColorForEvent,
  hexToRgba,
} from "@/features/calendar/utils/createEventModal/calendarEventColors";
import { layoutWeekAllDayEventLanes } from "@/features/calendar/utils/grid/calendarWeekAllDayLayout";

import {
  CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE,
  CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT,
} from "./calendarTimeGridConstants";
import { CalendarTimeGridDayHeader } from "./CalendarTimeGridDayHeader";
import { calendarTimeGridToYmd } from "./calendarTimeGridFormat";

const ALL_DAY_CHIP_TITLE_SIZE = 10;
const ALL_DAY_LANE_GAP_PX = 4;
const ALL_DAY_STRIP_PADDING_BOTTOM_PX = 8;

export type CalendarTimeGridWeekHeaderProps = {
  dayDates: Date[];
  events: ExtendedGoogleEvent[];
  calendars: GoogleCalendar[];
  /** Must match hour grid gutter + day tracks. */
  gridTemplateColumns: string;
  showWeekendTint?: boolean;
  onDayHeaderPress?: (date: Date) => void;
  onDayHeaderDoubleTap?: (date: Date) => void;
};

function allDayLanesHeightPx(laneCount: number): number {
  if (laneCount <= 0) {
    return ALL_DAY_STRIP_PADDING_BOTTOM_PX;
  }
  return (
    laneCount * CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT +
    Math.max(0, laneCount - 1) * ALL_DAY_LANE_GAP_PX +
    ALL_DAY_STRIP_PADDING_BOTTOM_PX
  );
}

export function CalendarTimeGridWeekHeader({
  dayDates,
  events,
  calendars,
  gridTemplateColumns,
  showWeekendTint = true,
  onDayHeaderPress,
  onDayHeaderDoubleTap,
}: CalendarTimeGridWeekHeaderProps) {
  const today = dateNow().startOf("day");
  const dayKeys = dayDates.map((d) => calendarTimeGridToYmd(d));

  const { placed, laneCount } = layoutWeekAllDayEventLanes(events, dayKeys);
  const maxVisibleLanes = CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE;
  const needsLaneScroll = laneCount > maxVisibleLanes;
  const innerAllDayHeightPx = allDayLanesHeightPx(laneCount);
  const outerMaxAllDayHeightPx = allDayLanesHeightPx(Math.min(laneCount, maxVisibleLanes));

  const innerGridColumns = `repeat(${dayDates.length}, minmax(0, 1fr))`;

  const allDayLayer = (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns: innerGridColumns,
        gridTemplateRows:
          laneCount > 0 ? `repeat(${laneCount}, ${CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT}px)` : "auto",
        columnGap: spacing(0),
        rowGap: spacing(1),
        width: "100%",
        minHeight: laneCount === 0 ? spacing(2) : undefined,
      }}
    >
      {laneCount === 0
        ? null
        : placed.map((bar, barIdx) => {
            const evColor = calendarColorForEvent(bar.event, calendars);
            return (
              <Box
                key={`allday-${bar.lane}-${bar.startCol}-${bar.endCol}-${barIdx}-${String(bar.event.id ?? "")}`}
                style={{
                  gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}`,
                  gridRow: bar.lane + 1,
                  borderRadius: spacing(1),
                  borderLeftWidth: 3,
                  borderLeftColor: evColor,
                  backgroundColor: hexToRgba(evColor, 0.18),
                  paddingHorizontal: spacing(1),
                  justifyContent: "center",
                  minWidth: 0,
                }}
              >
                <Text
                  style={{
                    fontSize: ALL_DAY_CHIP_TITLE_SIZE,
                    fontWeight: "600",
                    color: color("neutral.800"),
                  }}
                  numberOfLines={1}
                >
                  {bar.event.summary || "Untitled"}
                </Text>
              </Box>
            );
          })}
    </Box>
  );

  return (
    <Box
      style={{
        display: "grid",
        gridTemplateColumns,
        gridTemplateRows: "auto auto",
        width: "100%",
        borderBottomWidth: 1,
        borderColor: color("neutral.200"),
        backgroundColor: color("neutral.100"),
      }}
    >
      <Box
        style={{
          gridColumn: 1,
          gridRow: "1 / 3",
          borderRightWidth: 1,
          borderRightColor: color("neutral.200"),
          backgroundColor: color("neutral.50"),
          minHeight: spacing(0),
          minWidth: spacing(0),
        }}
      />
      {dayDates.map((d, idx) => {
        const isTodayCol = dayjs(d).isSame(today, "day");
        const wk = d.getDay();
        const weekend =
          showWeekendTint && (wk === 0 || wk === 6)
            ? { backgroundColor: hexToRgba(color("neutral.900"), 0.04) }
            : null;
        const colBg = isTodayCol
          ? color("olive.muted")
          : weekend?.backgroundColor != null
            ? weekend.backgroundColor
            : color("neutral.100");

        return (
          <Box
            key={calendarTimeGridToYmd(d)}
            style={{
              gridColumn: idx + 2,
              gridRow: 1,
              minWidth: 0,
              backgroundColor: colBg,
              borderRightWidth: idx < dayDates.length - 1 ? 1 : 0,
              borderRightColor: color("neutral.200"),
            }}
          >
            <CalendarTimeGridDayHeader
              date={d}
              isToday={isTodayCol}
              weekendStyle={weekend}
              showColumnDividerRight={false}
              chromeless
              onPress={onDayHeaderPress}
              onDoubleTap={onDayHeaderDoubleTap}
            />
          </Box>
        );
      })}
      <Box
        style={{
          gridColumn: "2 / -1",
          gridRow: 2,
          backgroundColor: color("neutral.50"),
          minWidth: spacing(0),
          paddingTop: spacing(0.5),
        }}
      >
        {needsLaneScroll ? (
          <ScrollView style={{ width: "100%", maxHeight: outerMaxAllDayHeightPx }}>
            <Box style={{ minHeight: innerAllDayHeightPx }}>{allDayLayer}</Box>
          </ScrollView>
        ) : (
          <Box style={{ minHeight: innerAllDayHeightPx }}>{allDayLayer}</Box>
        )}
      </Box>
    </Box>
  );
}
