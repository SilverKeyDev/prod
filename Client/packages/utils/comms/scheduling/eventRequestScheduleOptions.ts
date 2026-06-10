import { dayjs } from "packages/utils/core/date";

export type EventScheduleOption = {
  value: string;
  label: string;
  /** Web Dropdown: extra row classes (e.g. availability tint). */
  menuRowClassName?: string;
  /** Unavailable slots (busy or outside profile availability). */
  disabled?: boolean;
  /** Native list row hint for availability styling. */
  availabilityTone?: "available" | "unavailable" | "neutral";
};

/** Default number of selectable days starting at minDate (inclusive). */
export const EVENT_REQUEST_DATE_RANGE_DAYS = 180;

/** Minute step for time slots (e.g. 30 → 00:00, 00:30, …, 23:30). */
export const EVENT_REQUEST_TIME_STEP_MINUTES = 30;

/**
 * Build date options from minDate (YYYY-MM-DD) forward for dayCount days.
 */
export function buildDateOptions(minDateIso: string, dayCount: number): EventScheduleOption[] {
  const start = dayjs(minDateIso, "YYYY-MM-DD", true);
  if (!start.isValid() || dayCount < 1) {
    return [];
  }
  return Array.from({ length: dayCount }, (_, i) => {
    const d = start.add(i, "day");
    return {
      value: d.format("YYYY-MM-DD"),
      label: d.format("dddd, MMM D, YYYY"),
    };
  });
}

/**
 * Build time options for a full day in stepMinutes increments (values HH:mm 24h).
 */
export function buildTimeOptions(stepMinutes: number): EventScheduleOption[] {
  if (stepMinutes < 1 || stepMinutes > 60 || 60 % stepMinutes !== 0) {
    return [];
  }
  const options: EventScheduleOption[] = [];
  for (let total = 0; total < 24 * 60; total += stepMinutes) {
    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    options.push({
      value,
      label: formatTimeLabel(hour24, minute),
    });
  }
  return options;
}

function formatTimeLabel(hour24: number, minute: number): string {
  const d = dayjs().hour(hour24).minute(minute).second(0).millisecond(0);
  return d.format("h:mm A");
}
