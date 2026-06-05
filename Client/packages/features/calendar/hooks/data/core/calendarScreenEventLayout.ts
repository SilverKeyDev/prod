import { calendarDateToKey } from "packages/utils/comms/calendar/core/calendarDateKeys";
import { getVisibleDateRange } from "packages/utils/comms/calendar/core/date";
import { getEventLocalDayKeys } from "packages/utils/comms/calendar/parsing/eventParsing";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

export type CalendarScreenDayCell = {
  key: string;
  date: Date;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  count: number;
};

export function buildCalendarEventsByDay(
  gridDisplayEvents: ExtendedGoogleEvent[]
): Map<string, ExtendedGoogleEvent[]> {
  const map = new Map<string, ExtendedGoogleEvent[]>();
  for (const ev of gridDisplayEvents) {
    for (const key of getEventLocalDayKeys(ev)) {
      const arr = map.get(key);
      if (arr) arr.push(ev);
      else map.set(key, [ev]);
    }
  }
  return map;
}

export function buildCalendarMonthDayCells(
  focusedDate: Date,
  eventsByDay: Map<string, ExtendedGoogleEvent[]>
): CalendarScreenDayCell[] {
  const { gridDays } = getVisibleDateRange(focusedDate, "month");
  if (!gridDays) return [];
  return gridDays.map((day) => {
    const key = calendarDateToKey(day.date);
    const count = key ? (eventsByDay.get(key)?.length ?? 0) : 0;
    return {
      key,
      date: day.date,
      isCurrentMonth: day.isCurrentMonth,
      isPast: day.isPast,
      isToday: day.isToday,
      count,
    };
  });
}
