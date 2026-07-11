/**
 * Hook returning brokerage ancillary capture analytics filtered by time period.
 * Powers SIL-277 — primary sales document for SkySlope engagement.
 * TODO SIL-272: Swap for real API call once SkySlope sync lands.
 */
import { useMemo } from "react";

import { BROKERAGE_ANCILLARY_FIXTURE } from "../utils/brokerageAnalyticsFixtures";
import type { TimePeriod } from "./useBrokerageAnalytics";

const FEES = { title: 500, lending: 1000, escrow: 400, home_warranty: 150 } as const;
const RATES = { title: 62, lending: 44, escrow: 55, home_warranty: 48 };

function buildAncillaryData(period: TimePeriod) {
  const base = BROKERAGE_ANCILLARY_FIXTURE;
  const scale = period === "week" ? 0.05 : period === "month" ? 1 : period === "year" ? 12 : 24;
  const t = Math.round(2059 * scale);

  const by_service = (["title", "lending", "escrow", "home_warranty"] as const).map((svc) => {
    const rate = RATES[svc];
    const outside = Math.round(t * (1 - rate / 100));
    return {
      service: svc,
      in_house_count: Math.round((t * rate) / 100),
      outside_count: outside,
      attach_rate_percent: rate,
      leakage_dollars: outside * FEES[svc],
      fee_assumption: FEES[svc],
    };
  });

  const total_leakage = by_service.reduce((s, sv) => s + sv.leakage_dollars, 0);

  return {
    ...base,
    total_transactions: t,
    summary: { total_leakage_dollars: total_leakage, avg_attach_rate_percent: 52.3 },
    by_service,
  };
}

export function useAncillaryAnalytics(period: TimePeriod = "all") {
  const data = useMemo(() => buildAncillaryData(period), [period]);
  return { data, isLoading: false, error: null };
}
