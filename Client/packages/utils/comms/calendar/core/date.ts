import type { CalendarGridDay, CalendarViewType } from "packages/types/calendar/calendarGrid";
import { dateNow, dayjs } from "packages/utils/core/date";

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  return dayjs(date).subtract(dayjs(date).day(), "day").startOf("day").toDate();
}

/**
 * Calculate API fetch window: four calendar weeks (28 days) starting at the Sunday
 * of the week containing `date`, plus one week buffer before and after.
 * Past dates are allowed (no clamp to “this week”).
 */
export function calculateCalendarDateRange(date?: Date): {
  timeMin: string;
  timeMax: string;
} {
  const baseDate = date ? dayjs(date).startOf("day") : dateNow().startOf("day");
  const weekStart = baseDate.subtract(baseDate.day(), "day").startOf("day");
  const weekEnd = weekStart.add(28, "day").endOf("day");
  const bufferMin = weekStart.subtract(7, "day").startOf("day");
  const timeMax = weekEnd.add(7, "day").endOf("day");

  return {
    timeMin: bufferMin.toISOString(),
    timeMax: timeMax.toISOString(),
  };
}

/**
 * Navigate date by weeks
 */
export function navigateDate(date: Date, weeks: number): Date {
  return dayjs(date)
    .add(weeks * 7, "day")
    .toDate();
}

/**
 * Step the focused calendar anchor by one unit for toolbar prev/next.
 */
export function stepFocusedDate(
  current: Date,
  viewMode: CalendarViewType,
  direction: -1 | 1
): Date {
  const d = dayjs(current).startOf("day");
  switch (viewMode) {
    case "week":
      return d.add(direction * 7, "day").toDate();
    case "month":
    default: {
      const next = d.add(direction, "month");
      const dim = d.date();
      const lastDay = next.daysInMonth();
      const day = Math.min(dim, lastDay);
      return next.date(day).toDate();
    }
  }
}

/**
 * Calculate the visible date range for the calendar grid.
 * Month view: 28 days from the Sunday of the week containing `currentDate`.
 * Week: 7 days from that Sunday.
 *
 * `isCurrentMonth` is relative to the calendar month of `currentDate` (not “today’s” month).
 */
export function getVisibleDateRange(
  currentDate: Date,
  viewType: CalendarViewType = "month"
): { start: Date; end: Date; gridDays?: CalendarGridDay[] } {
  const date = dayjs(currentDate).startOf("day");
  const dayOfWeek = date.day();
  const weekStart = date.subtract(dayOfWeek, "day").startOf("day");

  const today = dateNow().startOf("day");
  const displayMonth = date.month();
  const displayYear = date.year();

  let daysToGenerate: number;
  const startDate = weekStart;

  switch (viewType) {
    case "week":
      daysToGenerate = 7;
      break;
    case "month":
    default:
      daysToGenerate = 28;
      break;
  }

  const firstDay = startDate.toDate();
  const lastDay = startDate
    .add(daysToGenerate - 1, "day")
    .endOf("day")
    .toDate();

  const gridDays: CalendarGridDay[] = [];
  for (let day = 0; day < daysToGenerate; day++) {
    const gridDate = startDate.add(day, "day").startOf("day");
    const gridDateJs = gridDate.toDate();

    const isCurrentMonth = gridDate.month() === displayMonth && gridDate.year() === displayYear;
    const isFirstOfMonth = gridDate.date() === 1;

    gridDays.push({
      date: gridDateJs,
      isCurrentMonth,
      isToday: gridDate.isSame(today, "day"),
      isPast: gridDate.isBefore(today, "day"),
      isFirstOfMonth,
    });
  }

  return { start: firstDay, end: lastDay, gridDays };
}

/**
 * Format a date range as a string (e.g., "Jan 4 - Feb 7, 2026" or "Jan 4, 2026" for single day)
 */
export function formatDateRange(start: Date, end: Date): string {
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const startDay = start.getDate();
  const startYear = start.getFullYear();

  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  const endDay = end.getDate();
  const endYear = end.getFullYear();

  if (
    start.getTime() === end.getTime() ||
    (start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear())
  ) {
    return `${startMonth} ${startDay}, ${startYear}`;
  }

  if (start.getMonth() === end.getMonth() && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }

  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }

  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}
