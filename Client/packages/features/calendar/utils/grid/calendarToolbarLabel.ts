import type { CalendarViewType } from "@/features/calendar/types/calendar";
import { getVisibleDateRange } from "@/features/calendar/utils/core/date";

/**
 * Formats the visible grid range with month and day for both endpoints
 * (e.g. "Apr 6 – Apr 12, 2026", "Apr 27 – May 24, 2026").
 */
export function formatToolbarDateRange(start: Date, end: Date): string {
  const startNorm = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endNorm = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const sm = startNorm.toLocaleDateString("en-US", { month: "short" });
  const sd = startNorm.getDate();
  const em = endNorm.toLocaleDateString("en-US", { month: "short" });
  const ed = endNorm.getDate();
  const sy = startNorm.getFullYear();
  const ey = endNorm.getFullYear();

  if (startNorm.getTime() === endNorm.getTime()) {
    return `${sm} ${sd}, ${sy}`;
  }

  if (sy === ey) {
    return `${sm} ${sd} – ${em} ${ed}, ${sy}`;
  }

  return `${sm} ${sd}, ${sy} – ${em} ${ed}, ${ey}`;
}

/**
 * Single-line label for the calendar toolbar: exact visible range (week or 28-day month grid).
 */
export function formatCalendarToolbarLabel(focusedDate: Date, viewMode: CalendarViewType): string {
  const { start, end } = getVisibleDateRange(focusedDate, viewMode);
  return formatToolbarDateRange(start, end);
}
