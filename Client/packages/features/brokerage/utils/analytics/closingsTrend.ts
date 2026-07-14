/**
 * Shared Kaggle demo closings time series for Overview, activity, and forensics.
 * Dec matches BROKERAGE_ANALYTICS_FIXTURE.overview.closingsThisMonth (1854).
 */
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

export type ClosingsTrendPoint = {
  label: string;
  value: number;
  displayValue: string;
};

/** Full calendar-year closings (Kaggle-shaped demo). */
export const FULL_YEAR_CLOSING_TREND: ClosingsTrendPoint[] = [
  { label: "Jan", value: 1884, displayValue: "1884" },
  { label: "Feb", value: 1755, displayValue: "1755" },
  { label: "Mar", value: 1921, displayValue: "1921" },
  { label: "Apr", value: 1880, displayValue: "1880" },
  { label: "May", value: 1928, displayValue: "1928" },
  { label: "Jun", value: 1898, displayValue: "1898" },
  { label: "Jul", value: 1935, displayValue: "1935" },
  { label: "Aug", value: 1873, displayValue: "1873" },
  { label: "Sep", value: 1890, displayValue: "1890" },
  { label: "Oct", value: 1913, displayValue: "1913" },
  { label: "Nov", value: 1845, displayValue: "1845" },
  { label: "Dec", value: 1854, displayValue: "1854" },
];

const PREV_YEAR_CLOSING_TREND: ClosingsTrendPoint[] = [
  { label: "Jan '24", value: 1720, displayValue: "1720" },
  { label: "Feb '24", value: 1640, displayValue: "1640" },
  { label: "Mar '24", value: 1810, displayValue: "1810" },
  { label: "Apr '24", value: 1755, displayValue: "1755" },
  { label: "May '24", value: 1830, displayValue: "1830" },
  { label: "Jun '24", value: 1790, displayValue: "1790" },
  { label: "Jul '24", value: 1870, displayValue: "1870" },
  { label: "Aug '24", value: 1800, displayValue: "1800" },
  { label: "Sep '24", value: 1820, displayValue: "1820" },
  { label: "Oct '24", value: 1855, displayValue: "1855" },
  { label: "Nov '24", value: 1780, displayValue: "1780" },
  { label: "Dec '24", value: 1795, displayValue: "1795" },
];

const FIVE_YEAR_CLOSING_TREND = [...PREV_YEAR_CLOSING_TREND, ...FULL_YEAR_CLOSING_TREND];

const SEVEN_DAY_CLOSING_TREND: ClosingsTrendPoint[] = [
  { label: "Mon", value: 58, displayValue: "58" },
  { label: "Tue", value: 71, displayValue: "71" },
  { label: "Wed", value: 63, displayValue: "63" },
  { label: "Thu", value: 82, displayValue: "82" },
  { label: "Fri", value: 74, displayValue: "74" },
  { label: "Sat", value: 29, displayValue: "29" },
  { label: "Sun", value: 18, displayValue: "18" },
];

const ONE_MONTH_CLOSING_TREND: ClosingsTrendPoint[] = Array.from({ length: 31 }, (_, i) => {
  const v = Math.round(55 + Math.sin(i * 0.4) * 12 + (i % 7 < 5 ? 10 : -15));
  return { label: `Dec ${i + 1}`, value: v, displayValue: String(v) };
});

/** Sum of FULL_YEAR_CLOSING_TREND values (Kaggle year closings). */
export const YEAR_CLOSING_TOTAL = FULL_YEAR_CLOSING_TREND.reduce((sum, p) => sum + p.value, 0);

/** December / month baseline — matches overview.closingsThisMonth. */
export const MONTH_CLOSING_TOTAL =
  FULL_YEAR_CLOSING_TREND[FULL_YEAR_CLOSING_TREND.length - 1]?.value ?? 1854;

export function closingsTrendForPeriod(period: TimePeriod): ClosingsTrendPoint[] {
  switch (period) {
    case "week":
      return SEVEN_DAY_CLOSING_TREND;
    case "month":
      return ONE_MONTH_CLOSING_TREND;
    case "year":
      return FULL_YEAR_CLOSING_TREND;
    case "5years":
    case "all":
    default:
      return FIVE_YEAR_CLOSING_TREND;
  }
}

/**
 * Scale the shared year closings curve to an agent's closings total.
 * Used by per-agent analytics (no synthetic sin wave).
 */
export function scaleClosingsTrendToAgentTotal(agentYearClosings: number): ClosingsTrendPoint[] {
  const share = YEAR_CLOSING_TOTAL > 0 ? agentYearClosings / YEAR_CLOSING_TOTAL : 0;
  return FULL_YEAR_CLOSING_TREND.map((point) => {
    const value = Math.max(0, Math.round(point.value * share));
    return { label: point.label, value, displayValue: String(value) };
  });
}
