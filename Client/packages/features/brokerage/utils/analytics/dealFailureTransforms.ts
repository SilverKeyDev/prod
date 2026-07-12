/**
 * Pure deal-failure forensics transforms (fixture-backed).
 */
import type { DealFailureForensics } from "packages/features/brokerage/types/analytics";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { BROKERAGE_DEAL_FAILURE_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

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

const STAGE_RATIOS = [0.38, 0.27, 0.18, 0.11, 0.06];
const STAGE_NAMES = ["Inspection", "Financing", "Appraisal", "Title", "Unknown"];

const LENDER_RATIOS = [0.28, 0.24, 0.21, 0.17, 0.1];
const LENDER_NAMES = ["Commonwealth Bank", "Westpac", "ANZ", "NAB", "Cash / Other"];

const BAND_RATIOS = [0.142, 0.287, 0.287, 0.284];
const BAND_NAMES = ["Under $1M", "$1M–$2M", "$2M–$3M", "$3M+"];
const BAND_CANCEL_RATIOS = [0.052, 0.049, 0.047, 0.049];

const MONTH_TOTAL = 2059;
const MONTH_CANCELLED = 111;

export function buildFailureData(period: TimePeriod): DealFailureForensics {
  const base = BROKERAGE_DEAL_FAILURE_FIXTURE;
  const scale = periodScale(period);

  let total: number;
  let cancelled: number;
  let trend: { month: string; total: number; cancelled: number }[];

  if (period === "week") {
    total = Math.round(MONTH_TOTAL * scale);
    cancelled = Math.round(MONTH_CANCELLED * scale);
    trend = [{ month: "This week", total, cancelled }];
  } else if (period === "month") {
    total = MONTH_TOTAL;
    cancelled = MONTH_CANCELLED;
    trend = [{ month: "Dec", total: MONTH_TOTAL, cancelled: MONTH_CANCELLED }];
  } else if (period === "year") {
    total = TREND_12M.reduce((s, m) => s + m.total, 0);
    cancelled = TREND_12M.reduce((s, m) => s + m.cancelled, 0);
    trend = TREND_12M;
  } else {
    const yearTotal = TREND_12M.reduce((s, m) => s + m.total, 0);
    const yearCancelled = TREND_12M.reduce((s, m) => s + m.cancelled, 0);
    total = Math.round(yearTotal * (scale / 12));
    cancelled = Math.round(yearCancelled * (scale / 12));
    trend = TREND_12M.map((m) => ({
      month: m.month,
      total: Math.round(m.total * (scale / 12)),
      cancelled: Math.round(m.cancelled * (scale / 12)),
    }));
  }

  const fall_rate = total > 0 ? +((cancelled / total) * 100).toFixed(1) : 0;

  const by_stage = STAGE_NAMES.map((stage, i) => ({
    stage,
    count: Math.round(cancelled * STAGE_RATIOS[i]),
  }));

  const by_lender = LENDER_NAMES.map((lender_name, i) => {
    const total_deals = Math.round(total * LENDER_RATIOS[i]);
    const lender_cancelled = Math.round(cancelled * LENDER_RATIOS[i]);
    return {
      lender_name,
      total_deals,
      cancelled: lender_cancelled,
      fall_through_rate_percent:
        total_deals > 0 ? +((lender_cancelled / total_deals) * 100).toFixed(1) : 0,
    };
  });

  const by_price_band = BAND_NAMES.map((band, i) => {
    const total_deals = Math.round(total * BAND_RATIOS[i]);
    const band_cancelled = Math.round(total_deals * BAND_CANCEL_RATIOS[i]);
    return {
      band,
      total_deals,
      cancelled: band_cancelled,
      fall_through_rate_percent:
        total_deals > 0 ? +((band_cancelled / total_deals) * 100).toFixed(1) : 0,
    };
  });

  const by_agent = base.by_agent.map((a) => ({
    ...a,
    total_deals: Math.round(a.total_deals * scale),
    cancelled: Math.round(a.cancelled * scale),
  }));

  return {
    ...base,
    summary: {
      total_transactions: total,
      total_cancelled: cancelled,
      fall_through_rate_percent: fall_rate,
      avg_days_to_cancellation: 22,
    },
    trend,
    by_stage,
    by_lender,
    by_price_band,
    by_agent,
    cycleTime: base.cycleTime,
  };
}
