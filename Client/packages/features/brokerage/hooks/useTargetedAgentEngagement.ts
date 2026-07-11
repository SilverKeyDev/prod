/**
 * Hook returning targeted agent engagement data filtered by time period.
 * Powers SIL-279 — targeted agent engagement panel.
 * TODO SIL-272: Swap for real API call once SkySlope sync lands.
 */
import { useMemo } from "react";

import { BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE } from "../utils/brokerageAnalyticsFixtures";
import type { TimePeriod } from "./useBrokerageAnalytics";

function buildEngagementData(period: TimePeriod) {
  const base = BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE;
  const scale = period === "week" ? 0.05 : period === "month" ? 1 : period === "year" ? 12 : 24;

  const flagged_agents = base.flagged_agents.map((a) => ({
    ...a,
    total_transactions: Math.round(a.total_transactions * scale),
    estimated_leakage_dollars: Math.round(a.estimated_leakage_dollars * scale),
  }));

  const total_recoverable = flagged_agents.reduce((s, a) => s + a.estimated_leakage_dollars, 0);

  return {
    ...base,
    summary: {
      ...base.summary,
      estimated_recoverable_dollars: total_recoverable,
    },
    flagged_agents,
    by_office: base.by_office.map((o) => ({
      ...o,
      estimated_leakage_dollars: Math.round(o.estimated_leakage_dollars * scale),
    })),
  };
}

export function useTargetedAgentEngagement(period: TimePeriod = "all") {
  const data = useMemo(() => buildEngagementData(period), [period]);
  return { data, isLoading: false, error: null };
}
