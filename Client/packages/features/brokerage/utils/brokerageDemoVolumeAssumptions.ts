/**
 * Shared demo brokerage volume for Leakage, Forensics, and Campaigns.
 * Anchored to the Kaggle analytics overview (500 agents, ~1,854 closings/month).
 */
import {
  MONTH_CLOSING_TOTAL,
  YEAR_CLOSING_TOTAL,
} from "packages/features/brokerage/utils/analytics/closingsTrend";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { BROKERAGE_ANALYTICS_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures.overview";

/** Demo roster size from Kaggle overview (activeAgents). */
export const DEMO_AGENT_COUNT = BROKERAGE_ANALYTICS_FIXTURE.overview.activeAgents;

/** Year closings = sum of shared Kaggle full-year closings trend. */
export const YEAR_TRANSACTIONS = YEAR_CLOSING_TOTAL;

/** Month = December / closingsThisMonth from the shared trend. */
export const MONTH_TRANSACTIONS = MONTH_CLOSING_TOTAL;

export const VOLUME_ASSUMPTION_FOOTNOTE = `${DEMO_AGENT_COUNT} agents · ${MONTH_TRANSACTIONS.toLocaleString()} closings/month`;

/** Presentation-only: national-scale demo persona (does not change seeded numbers). */
export const DEMO_BROKERAGE_PERSONA_NOTE = "National-scale demo brokerage (Compass-class volume)";

/** Transactions for a timeline period (year = YEAR_TRANSACTIONS trend sum). */
export function transactionsForPeriod(period: TimePeriod): number {
  if (period === "year") {
    return YEAR_TRANSACTIONS;
  }
  return Math.round(MONTH_TRANSACTIONS * periodScale(period));
}
