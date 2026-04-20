import type { CalendarViewType } from "@/features/calendar/types/calendar";
import { formatDateRange, getVisibleDateRange } from "@/features/calendar/utils/core/date";

/**
 * Single-line label for the calendar toolbar (month strip or week span).
 */
export function formatCalendarToolbarLabel(focusedDate: Date, viewMode: CalendarViewType): string {
  if (viewMode === "week") {
    const { start, end } = getVisibleDateRange(focusedDate, "week");
    return formatDateRange(start, end);
  }
  const { start, end } = getVisibleDateRange(focusedDate, "month");
  return formatDateRange(start, end);
}
