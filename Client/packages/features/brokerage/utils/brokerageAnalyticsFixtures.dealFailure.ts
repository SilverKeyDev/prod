/**
 * Brokerage analytics fixtures — deal failure forensics.
 * Volume aligned with Kaggle closings (~1,854/month). Trend totals match shared closingsTrend.
 * by_agent totals sized so cancelled ≥ 1 whenever fall-through rate is non-zero.
 */

import { FULL_YEAR_CLOSING_TREND } from "packages/features/brokerage/utils/analytics/closingsTrend";

const FALL_THROUGH_RATE = 0.049;

const yearTrend = FULL_YEAR_CLOSING_TREND.map((point) => ({
  month: point.label,
  total: point.value,
  cancelled: Math.round(point.value * FALL_THROUGH_RATE),
}));

const halfYear = yearTrend.slice(6);
const halfYearTotal = halfYear.reduce((s, m) => s + m.total, 0);
const halfYearCancelled = halfYear.reduce((s, m) => s + m.cancelled, 0);

export const BROKERAGE_DEAL_FAILURE_FIXTURE = {
  success: true,
  brokerage_org_id: "demo-brokerage-org-id",
  date_from: "2025-07-01T00:00:00+00:00",
  date_to: "2025-12-31T00:00:00+00:00",
  summary: {
    total_transactions: halfYearTotal,
    total_cancelled: halfYearCancelled,
    fall_through_rate_percent: 4.9,
    avg_days_to_cancellation: 22,
  },
  trend: halfYear,
  by_stage: [
    { stage: "Inspection", count: Math.round(halfYearCancelled * 0.38) },
    { stage: "Financing", count: Math.round(halfYearCancelled * 0.27) },
    { stage: "Appraisal", count: Math.round(halfYearCancelled * 0.18) },
    { stage: "Title", count: Math.round(halfYearCancelled * 0.11) },
    { stage: "Unknown", count: Math.round(halfYearCancelled * 0.06) },
  ],
  by_agent: [
    {
      agent_id: "AGT-0460",
      name: "Robin Pittman",
      total_deals: 25,
      cancelled: 2,
      fall_through_rate_percent: 8.0,
    },
    {
      agent_id: "AGT-0343",
      name: "Kristina Alexander",
      total_deals: 25,
      cancelled: 1,
      fall_through_rate_percent: 4.0,
    },
    {
      agent_id: "AGT-0372",
      name: "Brittney Collins",
      total_deals: 25,
      cancelled: 1,
      fall_through_rate_percent: 4.0,
    },
    {
      agent_id: "AGT-0276",
      name: "John Martin",
      total_deals: 25,
      cancelled: 2,
      fall_through_rate_percent: 8.0,
    },
    {
      agent_id: "AGT-0323",
      name: "Sara Spencer",
      total_deals: 25,
      cancelled: 2,
      fall_through_rate_percent: 8.0,
    },
    {
      agent_id: "AGT-0341",
      name: "Robert Tate",
      total_deals: 25,
      cancelled: 1,
      fall_through_rate_percent: 4.0,
    },
  ],
  by_lender: [
    {
      lender_name: "Better",
      total_deals: Math.round(halfYearTotal * 0.28),
      cancelled: Math.round(halfYearCancelled * 0.28),
      fall_through_rate_percent: 4.9,
    },
    {
      lender_name: "Rocket Mortgage",
      total_deals: Math.round(halfYearTotal * 0.24),
      cancelled: Math.round(halfYearCancelled * 0.24),
      fall_through_rate_percent: 4.9,
    },
    {
      lender_name: "UWM",
      total_deals: Math.round(halfYearTotal * 0.21),
      cancelled: Math.round(halfYearCancelled * 0.21),
      fall_through_rate_percent: 4.9,
    },
    {
      lender_name: "CrossCountry Mortgage",
      total_deals: Math.round(halfYearTotal * 0.17),
      cancelled: Math.round(halfYearCancelled * 0.17),
      fall_through_rate_percent: 4.9,
    },
    {
      lender_name: "Cash / Other",
      total_deals: Math.round(halfYearTotal * 0.1),
      cancelled: Math.round(halfYearCancelled * 0.1),
      fall_through_rate_percent: 4.9,
    },
  ],
  by_price_band: [
    {
      band: "Under $1M",
      total_deals: Math.round(halfYearTotal * 0.142),
      cancelled: Math.round(halfYearTotal * 0.142 * 0.052),
      fall_through_rate_percent: 5.2,
    },
    {
      band: "$1M–$2M",
      total_deals: Math.round(halfYearTotal * 0.287),
      cancelled: Math.round(halfYearTotal * 0.287 * 0.049),
      fall_through_rate_percent: 4.9,
    },
    {
      band: "$2M–$3M",
      total_deals: Math.round(halfYearTotal * 0.287),
      cancelled: Math.round(halfYearTotal * 0.287 * 0.047),
      fall_through_rate_percent: 4.7,
    },
    {
      band: "$3M+",
      total_deals: Math.round(halfYearTotal * 0.284),
      cancelled: Math.round(halfYearTotal * 0.284 * 0.049),
      fall_through_rate_percent: 4.9,
    },
  ],
  cycleTime: {
    avgContractToCloseDays: 38,
    medianContractToCloseDays: 34,
    timeInMilestone: [
      { stage: "Inspection", avgDays: 9 },
      { stage: "Financing", avgDays: 12 },
      { stage: "Appraisal", avgDays: 7 },
      { stage: "Title", avgDays: 6 },
      { stage: "Pending close", avgDays: 4 },
    ],
  },
};

export type BrokerageDealFailureFixture = typeof BROKERAGE_DEAL_FAILURE_FIXTURE;
