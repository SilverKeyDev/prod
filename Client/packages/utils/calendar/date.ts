import type { CalendarViewType, CalendarGridDay } from "./types";

/**
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
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
export function calculateCalendarDateRange(date?: Date): { timeMin: string; timeMax: string } {
  const baseDate = date ? new Date(date) : new Date();
  baseDate.setHours(0, 0, 0, 0);
  const weekStart = getWeekStart(baseDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 35); // 5 weeks = 35 days
  weekEnd.setHours(23, 59, 59, 999);

  return {
    timeMin: weekStart.toISOString(),
    timeMax: weekEnd.toISOString(),
  };
}

/**
 * Navigate date by weeks
 */
export function navigateDate(date: Date, weeks: number): Date {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + weeks * 7);
  return newDate;
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
  const date = new Date(currentDate);
  date.setHours(0, 0, 0, 0);
  
  // Find the start of the week containing currentDate (Sunday)
  const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Determine how many days to generate based on view type
  let daysToGenerate: number;
  let startDate: Date;

  switch (viewType) {
    case "day":
      daysToGenerate = 1;
      startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "week":
      daysToGenerate = 7;
      startDate = new Date(weekStart);
      startDate.setHours(0, 0, 0, 0);
      break;
    case "month":
    default:
      daysToGenerate = 35;
      startDate = new Date(weekStart);
      startDate.setHours(0, 0, 0, 0);
      break;
  }

  // First day (day = 0)
  const firstDay = new Date(startDate);
  firstDay.setHours(0, 0, 0, 0);
  
  // Last day (day = daysToGenerate - 1)
  const lastDay = new Date(startDate);
  lastDay.setDate(startDate.getDate() + (daysToGenerate - 1));
  lastDay.setHours(0, 0, 0, 0);

  // Generate grid days
  const gridDays: CalendarGridDay[] = [];
  for (let day = 0; day < daysToGenerate; day++) {
    const gridDate = new Date(startDate);
    gridDate.setDate(startDate.getDate() + day);
    gridDate.setHours(0, 0, 0, 0);

    const isCurrentMonth =
      gridDate.getMonth() === currentMonth &&
      gridDate.getFullYear() === currentYear;

    const isFirstOfMonth = gridDate.getDate() === 1;

    gridDays.push({
      date: gridDate,
      isCurrentMonth,
      isToday: gridDate.getTime() === today.getTime(),
      isPast: gridDate.getTime() < today.getTime(),
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

