import { dayjs } from "packages/utils/date";

export function formatCalendarDayEventsTitle(dateKey: string): string {
  const d = dayjs(dateKey, "YYYY-MM-DD", true);
  return d.isValid() ? d.format("dddd, MMMM D, YYYY") : "Selected day";
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
