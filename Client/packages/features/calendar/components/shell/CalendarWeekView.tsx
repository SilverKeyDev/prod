import { useMemo } from "react";

import { CalendarTimeGrid } from "packages/features/calendar/components/timeGrid";
import { getWeekStart } from "packages/utils/calendar/core/date";
import { dayjs } from "packages/utils/date";

import type { GoogleCalendar } from "@/features/calendar/api/types";
import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";
import type { WeekTimeSlotDoubleClickPayload } from "@/features/calendar/types/calendarQuickCreate";

export type CalendarWeekViewProps = {
  focusedDate: Date;
  events: ExtendedGoogleEvent[];
  calendars: GoogleCalendar[];
  onDayHeaderPress?: (date: Date) => void;
  onDayHeaderDoubleTap?: (date: Date) => void;
  onWeekTimeSlotDoubleClick?: (payload: WeekTimeSlotDoubleClickPayload) => void;
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

export function CalendarWeekView({
  focusedDate,
  events,
  calendars,
  onDayHeaderPress,
  onDayHeaderDoubleTap,
  onWeekTimeSlotDoubleClick,
  weekInteractionEnabled = false,
  weekSelectedEventId = null,
  onWeekEventSelect,
  onWeekEventOpenEdit,
  onWeekTimeColumnBackgroundPress,
  onWeekTimedResizeCommit,
}: CalendarWeekViewProps) {
  const dayDates = useMemo(() => {
    const start = getWeekStart(focusedDate);
    return Array.from({ length: 7 }, (_, i) => dayjs(start).add(i, "day").toDate());
  }, [focusedDate]);

  return (
    <CalendarTimeGrid
      dayDates={dayDates}
      events={events}
      calendars={calendars}
      onDayHeaderPress={onDayHeaderPress}
      onDayHeaderDoubleTap={onDayHeaderDoubleTap}
      onWeekTimeSlotDoubleClick={onWeekTimeSlotDoubleClick}
      weekInteractionEnabled={weekInteractionEnabled}
      weekSelectedEventId={weekSelectedEventId}
      onWeekEventSelect={onWeekEventSelect}
      onWeekEventOpenEdit={onWeekEventOpenEdit}
      onWeekTimeColumnBackgroundPress={onWeekTimeColumnBackgroundPress}
      onWeekTimedResizeCommit={onWeekTimedResizeCommit}
    />
  );
}
