import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

import { color, spacing } from "packages/design-tokens";
import { Box } from "packages/ui/components/structure/primitives";
import ScrollView from "packages/ui/components/structure/primitives/scroll/ScrollView";
import { dateNow } from "packages/utils/core/date";
import { getWindow } from "packages/utils/core/platform";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { WeekTimeSlotDoubleClickPayload } from "@/features/calendar/types/calendarQuickCreate";

import {
  CAL_TIME_GRID_DEFAULT_VISIBLE_HOUR_SPAN,
  CAL_TIME_GRID_DEFAULT_VISIBLE_START_HOUR,
  CAL_TIME_GRID_HOURS,
  calTimeGridTemplateColumns,
} from "./calendarTimeGridConstants";
import { CalendarTimeGridHourScrollContent } from "./CalendarTimeGridHourScrollContent";
import {
  type CalendarTimeGridScrollViewRef,
  setCalendarTimeGridScrollY,
} from "./calendarTimeGridScroll";
import { CalendarTimeGridWeekHeader } from "./CalendarTimeGridWeekHeader";

/**
 * Hour grid sits inside a vertical ScrollView; the scrollbar narrows the scrollport's
 * client width. Fixed rows above the scroll (week header with day strips and all-day lane)
 * must use that same width or `fr`/percentage columns will not line up with the grid below.
 */
function useTimeGridScrollportClientWidth(
  scrollRef: React.RefObject<CalendarTimeGridScrollViewRef | null>
): number | undefined {
  const [w, setW] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !(el instanceof HTMLElement)) {
      return;
    }
    const measure = () => {
      setW(el.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
    };
  }, [scrollRef]);

  return w;
}

export type CalendarTimeGridProps = {
  dayDates: Date[];
  events: ExtendedGoogleEvent[];
  calendars: GoogleCalendar[];
  onDayHeaderPress?: (date: Date) => void;
  onDayHeaderDoubleTap?: (date: Date) => void;
  onWeekTimeSlotDoubleClick?: (payload: WeekTimeSlotDoubleClickPayload) => void;
  showWeekendTint?: boolean;
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

export function CalendarTimeGrid({
  dayDates,
  events,
  calendars,
  onDayHeaderPress,
  onDayHeaderDoubleTap,
  onWeekTimeSlotDoubleClick,
  showWeekendTint = true,
  weekInteractionEnabled = false,
  weekSelectedEventId = null,
  onWeekEventSelect,
  onWeekEventOpenEdit,
  onWeekTimeColumnBackgroundPress,
  onWeekTimedResizeCommit,
}: CalendarTimeGridProps) {
  const scrollRef = useRef<CalendarTimeGridScrollViewRef | null>(null);
  const timeGridScrollportClientWidth = useTimeGridScrollportClientWidth(scrollRef);
  /** Matches hour grid inner width (scrollport minus vertical scrollbar). */
  const fixedRowsWidthStyle =
    timeGridScrollportClientWidth !== undefined
      ? ({ width: timeGridScrollportClientWidth, alignSelf: "flex-start" } as const)
      : undefined;
  const [hourRowHeight, setHourRowHeight] = useState(48);
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = dateNow();
    return n.hour() * 60 + n.minute();
  });

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const update = () => {
      setHourRowHeight(Math.min(48, Math.max(40, Math.round(win.innerHeight / 18))));
    };
    update();
    win.addEventListener("resize", update);
    return () => win.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      const n = dateNow();
      setNowMinutes(n.hour() * 60 + n.minute());
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const totalGridHeight = CAL_TIME_GRID_HOURS * hourRowHeight;
  const defaultScrollportHeight = CAL_TIME_GRID_DEFAULT_VISIBLE_HOUR_SPAN * hourRowHeight;
  const defaultScrollY = CAL_TIME_GRID_DEFAULT_VISIBLE_START_HOUR * hourRowHeight;
  const gridColumns = calTimeGridTemplateColumns(dayDates.length);

  /** Anchor scroll at 8am when the week or hour scale changes — do not depend on a new `Date` each render or scroll snaps back on every paint. */
  useEffect(() => {
    setCalendarTimeGridScrollY(scrollRef, defaultScrollY);
  }, [dayDates, defaultScrollY]);

  return (
    <Box
      style={{
        width: "100%",
        flexDirection: "column",
        minHeight: spacing(0),
      }}
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          overflow: "hidden",
          backgroundColor: color("neutral.50"),
          borderWidth: 1,
          borderColor: color("neutral.200"),
          borderRadius: spacing(1),
        }}
      >
        <Box style={fixedRowsWidthStyle}>
          <CalendarTimeGridWeekHeader
            dayDates={dayDates}
            events={events}
            calendars={calendars}
            gridTemplateColumns={gridColumns}
            showWeekendTint={showWeekendTint}
            onDayHeaderPress={onDayHeaderPress}
            onDayHeaderDoubleTap={onDayHeaderDoubleTap}
          />
        </Box>

        <ScrollView
          ref={scrollRef}
          style={{
            maxHeight: defaultScrollportHeight,
            flex: 1,
            width: "100%",
            minHeight: spacing(0),
            scrollbarGutter: "stable",
          }}
          contentContainerStyle={{
            minHeight: totalGridHeight,
            width: "100%",
            flexGrow: 1,
          }}
        >
          <CalendarTimeGridHourScrollContent
            dayDates={dayDates}
            events={events}
            calendars={calendars}
            gridTemplateColumns={gridColumns}
            hourRowHeight={hourRowHeight}
            nowMinutes={nowMinutes}
            showWeekendTint={showWeekendTint}
            onWeekTimeSlotDoubleClick={onWeekTimeSlotDoubleClick}
            weekInteractionEnabled={weekInteractionEnabled}
            weekSelectedEventId={weekSelectedEventId}
            onWeekEventSelect={onWeekEventSelect}
            onWeekEventOpenEdit={onWeekEventOpenEdit}
            onWeekTimeColumnBackgroundPress={onWeekTimeColumnBackgroundPress}
            onWeekTimedResizeCommit={onWeekTimedResizeCommit}
          />
        </ScrollView>
      </Box>
    </Box>
  );
}
