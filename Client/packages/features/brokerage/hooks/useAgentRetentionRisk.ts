import { useMemo } from "react";
import { BROKERAGE_AGENT_RETENTION_FIXTURE } from "../fixtures/brokerageAnalyticsFixtures";
import type { TimePeriod } from "./useBrokerageAnalytics";

function buildRetentionData(period: TimePeriod) {
  const base = BROKERAGE_AGENT_RETENTION_FIXTURE;
  const scale = period === "week" ? 0.05 : period === "month" ? 1 : period === "year" ? 12 : 24;

  const agents = base.agents.map(a => ({
    ...a,
    total_transactions: Math.round(a.total_transactions * scale),
    estimated_gci: Math.round(a.estimated_gci * scale),
  }));

  const flightRisk = agents.filter(a => a.risk_tier === "flight_risk");
  const watch = agents.filter(a => a.risk_tier === "watch");
  const stable = agents.filter(a => a.risk_tier === "stable");
  const overComp = agents.filter(a => a.risk_tier === "over_comp");
  const atRiskGci = [...flightRisk, ...watch].reduce((s, a) => s + a.estimated_gci, 0);

  return {
    ...base,
    agents,
    summary: {
      total_agents_scored: agents.length,
      flight_risk_count: flightRisk.length,
      watch_count: watch.length,
      stable_count: stable.length,
      over_comp_count: overComp.length,
      estimated_at_risk_gci: atRiskGci,
    },
    by_tier: base.by_tier.map(t => ({
      ...t,
      estimated_gci_at_risk: Math.round(t.estimated_gci_at_risk * scale),
    })),
  };
}

export function useAgentRetentionRisk(period: TimePeriod = "all") {
  const data = useMemo(() => buildRetentionData(period), [period]);
  return { data, isLoading: false, error: null };
}