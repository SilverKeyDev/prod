import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import type { IconName } from "packages/ui/types/icons";

export type { TimePeriod };
export type AnalyticsTab = "overview" | "agents" | "leakage" | "forensics" | "market";

export const TIME_PERIOD_OPTIONS: { value: TimePeriod; label: string }[] = [
  { value: "week", label: "7D" },
  { value: "month", label: "1M" },
  { value: "year", label: "1Y" },
  { value: "5years", label: "5Y" },
  { value: "all", label: "All" },
];

export const DASHBOARD_TABS: { id: AnalyticsTab; label: string; iconName: IconName }[] = [
  { id: "overview", label: "Overview", iconName: "bar-chart-2" },
  { id: "agents", label: "Agents", iconName: "users" },
  { id: "leakage", label: "Leakage", iconName: "trending-down" },
  { id: "forensics", label: "Deal forensics", iconName: "search" },
  { id: "market", label: "Market", iconName: "map" },
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
