import { color, spacing } from "packages/design-tokens";
import { Box, Text } from "packages/ui/components/primitives";
import ScrollView from "packages/ui/components/primitives/scroll/ScrollView";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import {
  calendarColorForEvent,
  hexToRgba,
} from "@/features/calendar/utils/createEventModal/calendarEventColors";
import { partitionCalendarEventsForDay } from "@/features/calendar/utils/grid/calendarGridLayout";

import {
  CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE,
  CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT,
} from "./calendarTimeGridConstants";
import { calendarTimeGridToYmd } from "./calendarTimeGridFormat";

export type CalendarTimeGridAllDaySectionProps = {
  dayDates: Date[];
  events: ExtendedGoogleEvent[];
  calendars: GoogleCalendar[];
  /** Must match day header + hour grid (CSS grid-template-columns). */
  gridTemplateColumns: string;
};

export function CalendarTimeGridAllDaySection({
  dayDates,
  events,
  calendars,
  gridTemplateColumns,
}: CalendarTimeGridAllDaySectionProps) {
  const byDay = dayDates.map(
    (d) => partitionCalendarEventsForDay(events, calendarTimeGridToYmd(d)).allDay
  );
  const maxRows = Math.max(...byDay.map((a) => a.length), 0);
  const cappedRows = Math.min(maxRows, CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE);
  const visibleRowCount = Math.max(1, cappedRows);
  /** Extra px below all-day chips (avoids mixing rem strings with number math). */
  const allDaySectionPaddingPx = 16;
  const scrollCapHeight =
    CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE * CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT + allDaySectionPaddingPx;
  const needsScroll = maxRows > CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE;
  const scrollMaxHeight = needsScroll
    ? scrollCapHeight
    : visibleRowCount * CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT + allDaySectionPaddingPx;

  const columnBody = (
    <Box
      style={{
        flexDirection: "row",
        minHeight: visibleRowCount * CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT + 4,
      }}
    >
      {dayDates.map((d, colIdx) => {
        const list = byDay[colIdx] ?? [];
        const isLast = colIdx === dayDates.length - 1;
        return (
          <Box
            key={calendarTimeGridToYmd(d)}
            style={{
              flex: 1,
              paddingHorizontal: spacing(0.5),
              borderRightWidth: isLast ? 0 : 1,
              borderRightColor: color("neutral.200"),
            }}
          >
            {list.slice(0, CAL_TIME_GRID_ALL_DAY_MAX_VISIBLE).map((ev, rowIdx) => {
              const evColor = calendarColorForEvent(ev, calendars);
              return (
                <Box
                  key={`${ev.id ?? `${colIdx}-${rowIdx}`}`}
                  style={{
                    height: CAL_TIME_GRID_ALL_DAY_ROW_HEIGHT - 4,
                    marginBottom: spacing(0.5),
                    borderRadius: spacing(1),
                    borderLeftWidth: 3,
                    borderLeftColor: evColor,
                    backgroundColor: hexToRgba(evColor, 0.18),
                    paddingHorizontal: spacing(1),
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: color("neutral.800"),
                    }}
                    numberOfLines={1}
                  >
                    {ev.summary || "Untitled"}
                  </Text>
                </Box>
              );
            })}
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
        width: "100%",
        borderBottomWidth: 1,
        borderColor: color("neutral.200"),
        backgroundColor: color("neutral.100"),
        paddingBottom: spacing(1),
      }}
    >
      <Box
        style={{
          minWidth: spacing(0),
          justifyContent: "center",
          paddingLeft: spacing(2),
          paddingRight: spacing(2),
          paddingVertical: spacing(1),
          borderRightWidth: 1,
          borderRightColor: color("neutral.200"),
        }}
      >
        <Text
          style={{
            fontSize: 10,
            color: color("neutral.500"),
            textAlign: "center",
          }}
        >
          All-day
        </Text>
      </Box>
      {needsScroll ? (
        <ScrollView
          style={{
            gridColumn: "2 / -1",
            minWidth: spacing(0),
            maxHeight: scrollMaxHeight,
          }}
        >
          {columnBody}
        </ScrollView>
      ) : (
        <Box
          style={{
            gridColumn: "2 / -1",
            minWidth: spacing(0),
            maxHeight: scrollMaxHeight,
          }}
        >
          {columnBody}
        </Box>
      )}
    </Box>
  );
}
