import { dayjs } from "packages/utils/date";

/**
 * Heading for the selected-day list: "Today's schedule" / long date for other days.
 */
export function getCalendarDayListHeading(dateKey: string): { title: string; subtitle?: string } {
  const d = dayjs(dateKey, "YYYY-MM-DD", true);
  if (!d.isValid()) {
    return { title: "Selected day" };
  }
  const todayKey = dayjs().format("YYYY-MM-DD");
  if (dateKey === todayKey) {
    return {
      title: "Today's schedule",
      subtitle: d.format("dddd, MMMM D, YYYY"),
    };
  }
  return { title: d.format("dddd, MMMM D, YYYY") };
}

/** @deprecated Prefer getCalendarDayListHeading for calendar shell copy. */
export function formatCalendarDayEventsTitle(dateKey: string): string {
  return getCalendarDayListHeading(dateKey).title;
}

export function calendarDateToKey(d: Date): string {
  try {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "";
  }
}
