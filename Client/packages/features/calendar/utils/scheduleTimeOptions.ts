import { dayjs } from "packages/utils/date";

export type ScheduleTimeOption = {
  value: string;
  label: string;
};

/**
 * Build time options for a full day in stepMinutes increments (values HH:mm 24h).
 */
export function buildTimeOptions(stepMinutes: number): ScheduleTimeOption[] {
  if (stepMinutes < 1 || stepMinutes > 60 || 60 % stepMinutes !== 0) {
    return [];
  }
  const options: ScheduleTimeOption[] = [];
  for (let total = 0; total < 24 * 60; total += stepMinutes) {
    const hour24 = Math.floor(total / 60);
    const minute = total % 60;
    const value = `${String(hour24).padStart(2, "0")}:${String(minute).padStart(
      2,
      "0",
    )}`;
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
