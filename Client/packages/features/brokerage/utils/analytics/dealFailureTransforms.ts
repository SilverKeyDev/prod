/**
 * Pure deal-failure forensics transforms (fixture-backed).
 * Month volume aligned with Kaggle closings via brokerageDemoVolumeAssumptions.
 */
import type { DealFailureForensics } from "packages/features/brokerage/types/analytics";
import { FULL_YEAR_CLOSING_TREND } from "packages/features/brokerage/utils/analytics/closingsTrend";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { BROKERAGE_DEAL_FAILURE_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";
import { MONTH_TRANSACTIONS } from "packages/features/brokerage/utils/brokerageDemoVolumeAssumptions";

/** Fall-through rate from deal-failure fixture summary (demo constant). */
const FALL_THROUGH_RATE = 0.049;

/** Seasonal closings from shared Kaggle trend; cancellations = rate × total. */
const TREND_12M = FULL_YEAR_CLOSING_TREND.map((point) => ({
  month: point.label,
  total: point.value,
  cancelled: Math.round(point.value * FALL_THROUGH_RATE),
}));

const STAGE_RATIOS = [0.38, 0.27, 0.18, 0.11, 0.06];
const STAGE_NAMES = ["Inspection", "Financing", "Appraisal", "Title", "Unknown"];

const LENDER_RATIOS = [0.28, 0.24, 0.21, 0.17, 0.1];
const LENDER_NAMES = ["Better", "Rocket Mortgage", "UWM", "CrossCountry Mortgage", "Cash / Other"];

const BAND_RATIOS = [0.142, 0.287, 0.287, 0.284];
const BAND_NAMES = ["Under $1M", "$1M–$2M", "$2M–$3M", "$3M+"];
const BAND_CANCEL_RATIOS = [0.052, 0.049, 0.047, 0.049];

const MONTH_TOTAL = MONTH_TRANSACTIONS;
const MONTH_CANCELLED = Math.round(MONTH_TRANSACTIONS * FALL_THROUGH_RATE);

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

  const by_agent = base.by_agent.map((a) => {
    const total_deals = Math.max(1, Math.round(a.total_deals * scale));
    const cancelled = Math.round(a.cancelled * scale);
    return {
      ...a,
      total_deals,
      cancelled,
      fall_through_rate_percent:
        total_deals > 0 ? +((cancelled / total_deals) * 100).toFixed(1) : 0,
    };
  });

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
