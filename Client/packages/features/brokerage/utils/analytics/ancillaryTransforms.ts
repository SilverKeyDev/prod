/**
 * Pure ancillary analytics transforms (fixture-backed).
 */
import type { AncillaryAnalytics } from "packages/features/brokerage/types/analytics";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  ANCILLARY_FEES,
  ANCILLARY_SERVICE_ORDER,
} from "packages/features/brokerage/utils/ancillaryFees";
import { BROKERAGE_ANCILLARY_FIXTURE } from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

const RATES = { title: 62, lending: 44, escrow: 55, home_warranty: 48 } as const;
const MONTH_BASE_TRANSACTIONS = 2059;

export function buildAncillaryData(period: TimePeriod): AncillaryAnalytics {
  const base = BROKERAGE_ANCILLARY_FIXTURE;
  const scale = periodScale(period);
  const t = Math.round(MONTH_BASE_TRANSACTIONS * scale);

  const by_service = ANCILLARY_SERVICE_ORDER.map((svc) => {
    const rate = RATES[svc];
    const outside = Math.round(t * (1 - rate / 100));
    return {
      service: svc,
      in_house_count: Math.round((t * rate) / 100),
      outside_count: outside,
      attach_rate_percent: rate,
      leakage_dollars: outside * ANCILLARY_FEES[svc],
      fee_assumption: ANCILLARY_FEES[svc],
    };
  });

  const total_leakage = by_service.reduce((s, sv) => s + sv.leakage_dollars, 0);

  const by_agent = base.by_agent.map((agent) => ({
    ...agent,
    transactions: Math.round(agent.transactions * scale),
    total_leakage_dollars: Math.round(agent.total_leakage_dollars * scale),
  }));

  return {
    ...base,
    total_transactions: t,
    summary: { total_leakage_dollars: total_leakage, avg_attach_rate_percent: 52.3 },
    by_service,
    by_agent,
  };
}
