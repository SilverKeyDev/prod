import type { CalendarViewType } from "packages/types/calendar/calendarGrid";
import { getVisibleDateRange } from "packages/utils/comms/calendar/core/date";
import { type Dayjs, dayjs } from "packages/utils/core/date";

/**
 * Formats the visible grid range with month and day for both endpoints
 * (e.g. "Apr 6 – Apr 12, 2026", "Apr 27 – May 24, 2026").
 */
export function formatToolbarDateRange(start: Dayjs, end: Dayjs): string {
  const startNorm = start.startOf("day");
  const endNorm = end.startOf("day");

  const sm = startNorm.format("MMM");
  const sd = String(startNorm.date());
  const em = endNorm.format("MMM");
  const ed = String(endNorm.date());
  const sy = startNorm.year();
  const ey = endNorm.year();

  if (startNorm.valueOf() === endNorm.valueOf()) {
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
  return formatToolbarDateRange(dayjs(start), dayjs(end));
}
