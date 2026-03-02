import { dateNow, dayjs } from "packages/utils/date";

import type { CalendarGridDay, CalendarViewType } from "./types";

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  return dayjs(date).subtract(dayjs(date).day(), "day").startOf("day").toDate();
}

/**
 * Calculate 5-week date range aligned to week boundaries
 * Returns the start of the week containing the specified date (or today if not provided) (Sunday) to 5 weeks later
 * This is the standard date range used throughout the calendar feature
 *
 * All calendar components use this single method for date range calculation.
 * For filtering to specific ranges (e.g., today, next 7 days), filter the events
 * after reading from cache rather than using different date range calculations.
 *
 * @param date - Optional date to calculate range from. Defaults to today.
 */
export function calculateCalendarDateRange(date?: Date): {
  timeMin: string;
  timeMax: string;
} {
  const baseDate = date ? dayjs(date).startOf("day") : dateNow().startOf("day");
  const weekStart = baseDate.subtract(baseDate.day(), "day").startOf("day");
  const weekEnd = weekStart.add(35, "day").endOf("day"); // 5 weeks = 35 days

  return {
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
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
 * Calculate the visible date range for the calendar grid
 * Returns the first and last day currently being displayed (5 weeks = 35 days by default)
 * This matches exactly what CalendarView displays - uses the same logic as the grid
 *
 * The grid shows 35 days starting from the Sunday of the week containing currentDate by default.
 * Can also generate 1 day or 1 week views.
 *
 * @param currentDate - The date to center the view around
 * @param viewType - Optional view type: "day" (1 day), "week" (7 days), or "month" (5 weeks, default)
 * @returns Object with start/end dates and optionally the grid days array
 */
export function getVisibleDateRange(
  currentDate: Date,
  viewType: CalendarViewType = "month"
): { start: Date; end: Date; gridDays?: CalendarGridDay[] } {
  const date = dayjs(currentDate).startOf("day");
  const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday, etc.
  const weekStart = date.subtract(dayOfWeek, "day").startOf("day");

  const today = dateNow().startOf("day");
  const currentMonth = today.month();
  const currentYear = today.year();

  // Determine how many days to generate based on view type
  let daysToGenerate: number;
  let startDate = weekStart;

  switch (viewType) {
    case "day":
      daysToGenerate = 1;
      startDate = date.startOf("day");
      break;
    case "week":
      daysToGenerate = 7;
      break;
    case "month":
    default:
      daysToGenerate = 35;
      break;
  }

  const firstDay = startDate.toDate();
  const lastDay = startDate
    .add(daysToGenerate - 1, "day")
    .endOf("day")
    .toDate();

  // Generate grid days
  const gridDays: CalendarGridDay[] = [];
  for (let day = 0; day < daysToGenerate; day++) {
    const gridDate = startDate.add(day, "day").startOf("day");
    const gridDateJs = gridDate.toDate();

    const isCurrentMonth = gridDate.month() === currentMonth && gridDate.year() === currentYear;
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

  // If it's the same day, show just one date
  if (
    start.getTime() === end.getTime() ||
    (start.getDate() === end.getDate() &&
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear())
  ) {
    return `${startMonth} ${startDay}, ${startYear}`;
  }

  // If same month and year
  if (start.getMonth() === end.getMonth() && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }

  // If same year but different months
  if (startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }

  // Different years
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
}
