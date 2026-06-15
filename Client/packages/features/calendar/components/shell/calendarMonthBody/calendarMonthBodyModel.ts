import { dateParseISO } from "packages/utils/core/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

export const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const TOP_BAND = 26;
export const BOTTOM_PAD = 8;
export const CHIP_STACK = 22;
export const MORE_LINE = 16;

export type MonthBodyDayCell = {
  key: string;
  date: Date;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
  count: number;
};

export function sortDayEvents(dayEvents: ExtendedGoogleEvent[]): ExtendedGoogleEvent[] {
  return [...dayEvents].sort((a, b) => {
    const aStart = a.start?.dateTime ?? a.start?.date;
    const bStart = b.start?.dateTime ?? b.start?.date;
    if (!aStart || !bStart) return 0;
    return dateParseISO(aStart).valueOf() - dateParseISO(bStart).valueOf();
  });
}

export function estimateCellMinHeight(
  d: MonthBodyDayCell,
  sortedEvents: ExtendedGoogleEvent[],
  isLargeScreen: boolean
): number {
  const floor = isLargeScreen ? 52 : 40;
  if (!isLargeScreen) {
    if (d.count === 0) {
      return Math.max(floor, TOP_BAND + BOTTOM_PAD + 6);
    }
    return Math.max(floor, TOP_BAND + BOTTOM_PAD + 14);
  }
  const n = sortedEvents.length;
  if (n === 0) {
    return Math.max(floor, TOP_BAND + BOTTOM_PAD + 6);
  }
  const visible = Math.min(n, 3);
  const more = n > 3 ? MORE_LINE : 0;
  return Math.max(floor, TOP_BAND + visible * CHIP_STACK + more + BOTTOM_PAD);
}

export function chunkWeeks(allDays: MonthBodyDayCell[]): MonthBodyDayCell[][] {
  const weeks: MonthBodyDayCell[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
}
