/**
 * Canonical brokerage analytics time-period model (SIL-274 timeline contract).
 * Shared by fixture hooks, UI labels, and the thin API client.
 */

export type TimePeriod = "week" | "month" | "year" | "5years" | "all";

export const TIME_PERIODS: readonly TimePeriod[] = [
  "week",
  "month",
  "year",
  "5years",
  "all",
] as const;

/** Month = 1.0 baseline — shared with server analytics_timeline.PERIOD_SCALE. */
export const PERIOD_SCALE: Record<TimePeriod, number> = {
  week: 0.05,
  month: 1,
  year: 12,
  "5years": 24,
  all: 24,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const PERIOD_DAYS: Record<TimePeriod, number> = {
  week: 7,
  month: 30,
  year: 365,
  "5years": 5 * 365,
  all: 10 * 365,
};

export function periodScale(period: TimePeriod): number {
  return PERIOD_SCALE[period];
}

export function timelineToDateRange(
  period: TimePeriod,
  now: Date = new Date()
): { dateFrom: Date; dateTo: Date } {
  const dateTo = new Date(now.getTime());
  const dateFrom = new Date(now.getTime() - PERIOD_DAYS[period] * MS_PER_DAY);
  return { dateFrom, dateTo };
}

export function isTimePeriod(value: string): value is TimePeriod {
  return (TIME_PERIODS as readonly string[]).includes(value);
}
