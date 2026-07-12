import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

export type { TimePeriod };
export type AnalyticsTab = "overview" | "agents" | "leakage" | "forensics" | "market";

export const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "week", label: "7D" },
  { value: "month", label: "1M" },
  { value: "year", label: "1Y" },
  { value: "5years", label: "5Y" },
  { value: "all", label: "All" },
];

export const DASHBOARD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "agents", label: "Agents" },
  { id: "leakage", label: "Leakage" },
  { id: "forensics", label: "Deal forensics" },
  { id: "market", label: "Market" },
];

export const CLOSINGS_LABEL: Record<TimePeriod, string> = {
  week: "Closings This Week",
  month: "Closings This Month",
  year: "Closings This Year",
  "5years": "Total Closings (5Y)",
  all: "Total Closings (All)",
};

export const TREND_TITLE: Record<TimePeriod, string> = {
  week: "Closings Trend (7 Days)",
  month: "Closings Trend (1 Month)",
  year: "Closings Trend (12 Months)",
  "5years": "Closings Trend (5 Years)",
  all: "Closings Trend (All Time)",
};

export const DELTA_LABEL: Record<TimePeriod, string> = {
  week: "vs last week",
  month: "vs last month",
  year: "vs last year",
  "5years": "vs prior period",
  all: "vs prior period",
};
