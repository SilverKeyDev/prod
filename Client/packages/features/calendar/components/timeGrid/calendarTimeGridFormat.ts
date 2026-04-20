import { dayjs } from "packages/utils/date";

import type { ExtendedGoogleEvent } from "@/features/calendar/types/calendar";

export function calendarTimeGridToYmd(d: Date): string {
  return dayjs(d).format("YYYY-MM-DD");
}

export function formatCalendarHourLabel(h: number): string {
  return dayjs().hour(h).minute(0).second(0).format("h A");
}

export function formatCalendarEventTimeRange(ev: ExtendedGoogleEvent): string {
  const s = ev.start?.dateTime;
  const e = ev.end?.dateTime;
  if (!s || !e) return "";
  try {
    const sd = dayjs(s);
    const ed = dayjs(e);
    return `${sd.format("h:mm A")} – ${ed.format("h:mm A")}`;
  } catch {
    return "";
  }
}

/** Local same-day range label for week grid (minutes from midnight). */
export function formatCalendarSliceMinutesRange(startMin: number, endMin: number): string {
  const sd = dayjs().startOf("day").add(startMin, "minute");
  const ed = dayjs().startOf("day").add(endMin, "minute");
  return `${sd.format("h:mm A")} – ${ed.format("h:mm A")}`;
}
