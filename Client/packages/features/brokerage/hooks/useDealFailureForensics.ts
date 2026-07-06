/**
 * Hook returning brokerage deal failure forensics filtered by time period.
 * Powers SIL-281 — deal failure forensics panel.
 * TODO SIL-272: Swap for real API call once SkySlope sync lands.
 */
import { useMemo } from "react";
import { BROKERAGE_DEAL_FAILURE_FIXTURE } from "../fixtures/brokerageAnalyticsFixtures";
import type { TimePeriod } from "./useBrokerageAnalytics";

const TREND_12M = [
  { month: "Jan", total: 2087, cancelled: 85 },
  { month: "Feb", total: 1945, cancelled: 72 },
  { month: "Mar", total: 2131, cancelled: 98 },
  { month: "Apr", total: 2091, cancelled: 90 },
  { month: "May", total: 2131, cancelled: 88 },
  { month: "Jun", total: 2096, cancelled: 102 },
  { month: "Jul", total: 2147, cancelled: 113 },
  { month: "Aug", total: 2085, cancelled: 110 },
  { month: "Sep", total: 2105, cancelled: 111 },
  { month: "Oct", total: 2102, cancelled: 79 },
  { month: "Nov", total: 2038, cancelled: 96 },
  { month: "Dec", total: 2059, cancelled: 111 },
];

// Stage distribution ratios — consistent across periods
const STAGE_RATIOS = [0.38, 0.27, 0.18, 0.11, 0.06];
const STAGE_NAMES = ["Inspection", "Financing", "Appraisal", "Title", "Unknown"];

// Lender distribution ratios
const LENDER_RATIOS = [0.28, 0.24, 0.21, 0.17, 0.10];
const LENDER_NAMES = ["Commonwealth Bank", "Westpac", "ANZ", "NAB", "Cash / Other"];

// Price band ratios
const BAND_RATIOS = [0.142, 0.287, 0.287, 0.284];
const BAND_NAMES = ["Under $1M", "$1M–$2M", "$2M–$3M", "$3M+"];
const BAND_CANCEL_RATIOS = [0.052, 0.049, 0.047, 0.049];

function buildFailureData(period: TimePeriod) {
  const base = BROKERAGE_DEAL_FAILURE_FIXTURE;

  let total: number;
  let cancelled: number;
  let trend: { month: string; total: number; cancelled: number }[];

  if (period === "week") {
    total = 500; cancelled = 25;
    trend = [{ month: "This week", total: 500, cancelled: 25 }];
  } else if (period === "month") {
    total = 2059; cancelled = 111;
    trend = [{ month: "Dec", total: 2059, cancelled: 111 }];
  } else if (period === "year") {
    total = TREND_12M.reduce((s, m) => s + m.total, 0);
    cancelled = TREND_12M.reduce((s, m) => s + m.cancelled, 0);
    trend = TREND_12M;
  } else {
    // 5years / all — double the year
    total = TREND_12M.reduce((s, m) => s + m.total * 2, 0);
    cancelled = TREND_12M.reduce((s, m) => s + m.cancelled * 2, 0);
    trend = TREND_12M.map(m => ({ month: m.month, total: m.total * 2, cancelled: m.cancelled * 2 }));
  }

  const fall_rate = +(cancelled / total * 100).toFixed(1);

  // Scale by_stage from cancelled count
  const by_stage = STAGE_NAMES.map((stage, i) => ({
    stage,
    count: Math.round(cancelled * STAGE_RATIOS[i]),
  }));

  // Scale by_lender from total count
  const by_lender = LENDER_NAMES.map((lender_name, i) => {
    const total_deals = Math.round(total * LENDER_RATIOS[i]);
    const lender_cancelled = Math.round(cancelled * LENDER_RATIOS[i]);
    return {
      lender_name,
      total_deals,
      cancelled: lender_cancelled,
      fall_through_rate_percent: +(lender_cancelled / total_deals * 100).toFixed(1),
    };
  });

  // Scale by_price_band
  const by_price_band = BAND_NAMES.map((band, i) => {
    const total_deals = Math.round(total * BAND_RATIOS[i]);
    const band_cancelled = Math.round(total_deals * BAND_CANCEL_RATIOS[i]);
    return {
      band,
      total_deals,
      cancelled: band_cancelled,
      fall_through_rate_percent: +(band_cancelled / total_deals * 100).toFixed(1),
    };
  });

  // Scale by_agent total_deals proportionally (keep fall rates real)
  const scale = period === "week" ? 0.05 : period === "month" ? 1 : period === "year" ? 12 : 24;
  const by_agent = base.by_agent.map(a => ({
    ...a,
    total_deals: Math.round(a.total_deals * scale / 12),
    cancelled: Math.round(a.cancelled * scale / 12),
  }));

  return {
    ...base,
    summary: { total_transactions: total, total_cancelled: cancelled, fall_through_rate_percent: fall_rate, avg_days_to_cancellation: 22 },
    trend,
    by_stage,
    by_lender,
    by_price_band,
    by_agent,
  };
}

export function useDealFailureForensics(period: TimePeriod = "all") {
  const data = useMemo(() => buildFailureData(period), [period]);
  return { data, isLoading: false, error: null };
}