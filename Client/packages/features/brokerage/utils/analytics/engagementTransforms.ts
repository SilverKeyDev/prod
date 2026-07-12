/**
 * Pure retention / engagement transforms (fixture-backed).
 */
import type {
  AgentRetentionRisk,
  TargetedAgentEngagement,
} from "packages/features/brokerage/types/analytics";
import { periodScale, type TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import {
  BROKERAGE_AGENT_RETENTION_FIXTURE,
  BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

export function buildRetentionData(period: TimePeriod): AgentRetentionRisk {
  const base = BROKERAGE_AGENT_RETENTION_FIXTURE;
  const scale = periodScale(period);

  const agents = base.agents.map((a) => ({
    ...a,
    total_transactions: Math.round(a.total_transactions * scale),
    estimated_gci: Math.round(a.estimated_gci * scale),
  }));

  const flightRisk = agents.filter((a) => a.risk_tier === "flight_risk");
  const watch = agents.filter((a) => a.risk_tier === "watch");
  const stable = agents.filter((a) => a.risk_tier === "stable");
  const overComp = agents.filter((a) => a.risk_tier === "over_comp");
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
    by_tier: base.by_tier.map((t) => ({
      ...t,
      estimated_gci_at_risk: Math.round(t.estimated_gci_at_risk * scale),
    })),
  };
}

export function buildEngagementData(period: TimePeriod): TargetedAgentEngagement {
  const base = BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE;
  const scale = periodScale(period);

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
