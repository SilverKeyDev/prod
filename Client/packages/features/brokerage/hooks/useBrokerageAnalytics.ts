/**
 * Hook returning brokerage analytics data filtered by time period.
 * Currently returns fixture data sliced by period — swap for real API call when SIL-202 lands.
 * Shape mirrors planned GET /api/v1/brokerage/analytics/overview response.
 */
import { useMemo } from "react";
import {
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_ANALYTICS_FIXTURE,
} from "../fixtures/brokerageAnalyticsFixtures";

export type TimePeriod = "week" | "month" | "year" | "5years" | "all";

const FULL_YEAR_TREND = [
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

const PREV_YEAR_TREND = [
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

const FIVE_YEAR_TREND = [...PREV_YEAR_TREND, ...FULL_YEAR_TREND];

const SEVEN_DAY_TREND = [
  { label: "Mon", value: 58, displayValue: "58" },
  { label: "Tue", value: 71, displayValue: "71" },
  { label: "Wed", value: 63, displayValue: "63" },
  { label: "Thu", value: 82, displayValue: "82" },
  { label: "Fri", value: 74, displayValue: "74" },
  { label: "Sat", value: 29, displayValue: "29" },
  { label: "Sun", value: 18, displayValue: "18" },
];

const ONE_MONTH_TREND = Array.from({ length: 31 }, (_, i) => {
  const v = Math.round(55 + Math.sin(i * 0.4) * 12 + (i % 7 < 5 ? 10 : -15));
  return { label: `Dec ${i + 1}`, value: v, displayValue: String(v) };
});

// Messaging activity scales with period
const MESSAGING_7D = [
  { label: "Mon", value: 142, displayValue: "142" },
  { label: "Tue", value: 168, displayValue: "168" },
  { label: "Wed", value: 155, displayValue: "155" },
  { label: "Thu", value: 189, displayValue: "189" },
  { label: "Fri", value: 172, displayValue: "172" },
  { label: "Sat", value: 67, displayValue: "67" },
  { label: "Sun", value: 43, displayValue: "43" },
];

function agentStatusForPeriod(period: TimePeriod) {
  // Scale proportionally: top 20%, healthy 71%, at_risk 9%
  const total = period === "week" ? 25 : period === "month" ? 100 : period === "year" ? 500 : 1000;
  const top = Math.round(total * 0.20);
  const atRisk = Math.round(total * 0.09);
  const healthy = total - top - atRisk;
  return [
    { label: "Top Performer", value: top, color: "#22c55e" },
    { label: "Healthy", value: healthy, color: "#3b82f6" },
    { label: "At Risk", value: atRisk, color: "#ef4444" },
  ];
}

function overviewForPeriod(period: TimePeriod) {
  const base = BROKERAGE_ANALYTICS_FIXTURE.overview;
  switch (period) {
    case "week":
      return { ...base, closingsThisMonth: 395, closingsLastMonth: 412, openTransactions: 610, atRiskCount: 11, activeAgents: 500, activeClientsThisMonth: 640, activeClientsLastMonth: 580 };
    case "month":
      return { ...base, closingsThisMonth: 1854, closingsLastMonth: 1845, openTransactions: 2455, atRiskCount: 44, activeAgents: 500, activeClientsThisMonth: 2655, activeClientsLastMonth: 2535 };
    case "year":
      return { ...base, closingsThisMonth: 22726, closingsLastMonth: 21465, openTransactions: 2455, atRiskCount: 44, activeAgents: 500, activeClientsThisMonth: 24500, activeClientsLastMonth: 23200 };
    case "5years":
    case "all":
    default:
      return { ...base, closingsThisMonth: 45224, closingsLastMonth: 43578, openTransactions: 2455, atRiskCount: 44, activeAgents: 500, activeClientsThisMonth: 47800, activeClientsLastMonth: 45600 };
  }
}

function trendForPeriod(period: TimePeriod) {
  switch (period) {
    case "week": return SEVEN_DAY_TREND;
    case "month": return ONE_MONTH_TREND;
    case "year": return FULL_YEAR_TREND;
    case "5years":
    case "all":
    default: return FIVE_YEAR_TREND;
  }
}

function funnelForPeriod(period: TimePeriod) {
  const scale = period === "week" ? 0.05 : period === "month" ? 0.2 : period === "year" ? 1 : 2;
  return [
    { stage: "Search",   count: Math.round(3255 * scale), dropOffPercent: 0 },
    { stage: "Tour",     count: Math.round(2855 * scale), dropOffPercent: 12 },
    { stage: "Offer",    count: Math.round(2555 * scale), dropOffPercent: 10 },
    { stage: "Contract", count: Math.round(2455 * scale), dropOffPercent: 4 },
    { stage: "Closing",  count: Math.round(1854 * scale), dropOffPercent: 24 },
  ];
}

export function useBrokerageAnalytics(period: TimePeriod = "all") {
  const data = useMemo(() => ({
    ...BROKERAGE_ANALYTICS_FIXTURE,
    overview: overviewForPeriod(period),
    closingsTrend: trendForPeriod(period),
    transactionFunnel: funnelForPeriod(period),
    agentStatusBreakdown: agentStatusForPeriod(period),
    messagingActivity: MESSAGING_7D, // always last 7 days regardless of period
  }), [period]);

  return {
    data,
    agents: BROKERAGE_AGENTS_FIXTURE,
    isLoading: false,
  };
}