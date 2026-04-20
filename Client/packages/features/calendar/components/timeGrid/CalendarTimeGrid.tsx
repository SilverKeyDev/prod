import React, { useEffect, useRef, useState } from "react";

import { color, spacing } from "packages/design-tokens";
import { Box } from "packages/ui/components/primitives";
import ScrollView from "packages/ui/components/primitives/scroll/ScrollView";
import { dateNow, dayjs } from "packages/utils/date";
import { getWindow } from "packages/utils/platform";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

import { CalendarTimeGridAllDaySection } from "./CalendarTimeGridAllDaySection";
import { CAL_TIME_GRID_HOURS, calTimeGridTemplateColumns } from "./calendarTimeGridConstants";
import { CalendarTimeGridDayHeader } from "./CalendarTimeGridDayHeader";
import { calendarTimeGridToYmd } from "./calendarTimeGridFormat";
import { CalendarTimeGridHourScrollContent } from "./CalendarTimeGridHourScrollContent";
import {
  type CalendarTimeGridScrollViewRef,
  setCalendarTimeGridScrollY,
} from "./calendarTimeGridScroll";

export type CalendarTimeGridProps = {
  dayDates: Date[];
  events: ExtendedGoogleEvent[];
  calendars: GoogleCalendar[];
  onDayHeaderPress?: (date: Date) => void;
  onDayHeaderDoubleTap?: (date: Date) => void;
  onWeekTimeSlotDoubleClick?: (payload: { date: Date; minutesFromMidnight: number }) => void;
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
  const [hourRowHeight, setHourRowHeight] = useState(48);
  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = dateNow();
    return n.hour() * 60 + n.minute();
  });

  useEffect(() => {
    const win = getWindow();
    if (!win) return;
    const update = () => {
      setHourRowHeight(Math.max(40, Math.round(win.innerHeight / 15)));
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
  const today = dateNow().startOf("day");
  const gridColumns = calTimeGridTemplateColumns(dayDates.length);

  useEffect(() => {
    const hasToday = dayDates.some((d) => dayjs(d).isSame(today, "day"));
    if (!hasToday) {
      setCalendarTimeGridScrollY(scrollRef, 8 * hourRowHeight);
      return;
    }
    const n = dateNow();
    const m = n.hour() * 60 + n.minute();
    const y = (m / 60) * hourRowHeight;
    setCalendarTimeGridScrollY(scrollRef, Math.max(0, y - hourRowHeight * 2));
  }, [dayDates, hourRowHeight, today]);

  return (
    <Box
      style={{
        width: "100%",
        flexDirection: "column",
        minHeight: spacing(80),
      }}
    >
      <Box
        style={{
          width: "100%",
          overflow: "hidden",
          backgroundColor: color("neutral.50"),
          borderWidth: 1,
          borderColor: color("neutral.200"),
          borderRadius: spacing(1),
        }}
      >
        <CalendarTimeGridAllDaySection
          dayDates={dayDates}
          events={events}
          calendars={calendars}
          gridTemplateColumns={gridColumns}
        />
        <Box
          style={{
            display: "grid",
            gridTemplateColumns: gridColumns,
            width: "100%",
            borderBottomWidth: 1,
            borderColor: color("neutral.200"),
            backgroundColor: color("neutral.100"),
            scrollbarGutter: "stable",
          }}
        >
          <Box
            style={{
              minWidth: spacing(0),
              borderRightWidth: 1,
              borderRightColor: color("neutral.200"),
            }}
          />
          {dayDates.map((d, idx) => {
            const isToday = dayjs(d).isSame(today, "day");
            const wk = d.getDay();
            const weekend =
              showWeekendTint && (wk === 0 || wk === 6)
                ? { backgroundColor: "rgba(0,0,0,0.04)" }
                : null;
            return (
              <CalendarTimeGridDayHeader
                key={calendarTimeGridToYmd(d)}
                date={d}
                isToday={isToday}
                weekendStyle={weekend}
                showColumnDividerRight={idx < dayDates.length - 1}
                onPress={onDayHeaderPress}
                onDoubleTap={onDayHeaderDoubleTap}
              />
            );
          })}
        </Box>

        <ScrollView
          ref={scrollRef}
          style={{
            maxHeight: Math.min(640, Math.round(hourRowHeight * CAL_TIME_GRID_HOURS * 0.65)),
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
