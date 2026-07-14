/**
 * Pure transforms for per-agent analytics detail view.
 * Joins fixtures and generates deterministic series/benchmarks.
 */

import { color } from "packages/design-tokens";
import type { LineSeries } from "packages/features/brokerage/components/charts";
import type { BrokerageAnalyticsAgent } from "packages/features/brokerage/types/analytics";
import { scaleClosingsTrendToAgentTotal } from "packages/features/brokerage/utils/analytics/closingsTrend";
import {
  ANCILLARY_ATTACH_RATES,
  BROKERAGE_AGENT_RETENTION_FIXTURE,
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_ANCILLARY_FIXTURE,
  BROKERAGE_DEAL_FAILURE_FIXTURE,
  BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

export interface AgentDetailView {
  agent: BrokerageAnalyticsAgent;
  leakageAgent: (typeof BROKERAGE_ANCILLARY_FIXTURE.by_agent)[0] | null;
  forensicsAgent: (typeof BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent)[0] | null;
  retentionAgent: (typeof BROKERAGE_AGENT_RETENTION_FIXTURE.agents)[0] | null;
  engagementAgent: (typeof BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE.flagged_agents)[0] | null;

  // Computed metrics
  kpis: AgentKpis;
  productionSeries: LineSeries[];
  peerBenchmarks: AgentPeerBenchmarks;
  ancillaryAttach: AgentAncillaryData;
  forensicsData: AgentForensicsData;
}

export interface AgentKpis {
  totalClosings: number;
  totalVolume: number;
  totalGci: number;
  activeClients: number;
  momentum90d: number;
  fallThroughRate: number | null;
  estimatedLeakage: number | null;
  stallStage: string | null;
}

export interface AgentPeerBenchmarks {
  closings: { agent: number; brokerageAvg: number };
  volume: { agent: number; brokerageAvg: number };
  gci: { agent: number; brokerageAvg: number };
  fallThroughRate: { agent: number | null; brokerageAvg: number };
}

export interface AgentAncillaryData {
  services: Array<{
    service: string;
    agentRate: number;
    brokerageAvg: number;
  }>;
  totalLeakage: number;
}

export interface AgentForensicsData {
  fallThroughRate: number;
  cancelled: number;
  totalDeals: number;
  failureStages: Array<{ stage: string; share: number }>;
}

/**
 * Main builder for agent detail view - joins all fixtures and computes derived metrics.
 */
export function buildAgentDetailView(agentId: string): AgentDetailView | null {
  const agent = BROKERAGE_AGENTS_FIXTURE.find((a) => a.id === agentId);
  if (!agent) return null;

  const leakageAgent =
    BROKERAGE_ANCILLARY_FIXTURE.by_agent.find((a) => a.agent_id === agentId) ?? null;
  const forensicsAgent =
    BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent.find((a) => a.agent_id === agentId) ?? null;
  const retentionAgent =
    BROKERAGE_AGENT_RETENTION_FIXTURE.agents.find((a) => a.agent_id === agentId) ?? null;
  const engagementAgent =
    BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE.flagged_agents.find((a) => a.agent_id === agentId) ??
    null;

  return {
    agent,
    leakageAgent,
    forensicsAgent,
    retentionAgent,
    engagementAgent,
    kpis: buildAgentKpis(agent, leakageAgent, forensicsAgent),
    productionSeries: buildProductionSeries(agent),
    peerBenchmarks: buildPeerBenchmarks(agent, forensicsAgent),
    ancillaryAttach: buildAncillaryData(leakageAgent, engagementAgent),
    forensicsData: buildForensicsData(forensicsAgent),
  };
}

function buildAgentKpis(
  agent: BrokerageAnalyticsAgent,
  leakageAgent: (typeof BROKERAGE_ANCILLARY_FIXTURE.by_agent)[0] | null,
  forensicsAgent: (typeof BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent)[0] | null
): AgentKpis {
  return {
    totalClosings: agent.closings,
    totalVolume: agent.volumeDollars,
    totalGci: agent.gci,
    activeClients: agent.activeClients,
    momentum90d: agent.momentum90dPercent,
    fallThroughRate: forensicsAgent?.fall_through_rate_percent ?? null,
    estimatedLeakage: leakageAgent?.total_leakage_dollars ?? null,
    stallStage: agent.stall,
  };
}

function buildProductionSeries(agent: BrokerageAnalyticsAgent): LineSeries[] {
  const agentValues = scaleClosingsTrendToAgentTotal(agent.closings).map((p) =>
    Math.max(1, p.value)
  );

  const brokerageAvgClosings = Math.round(
    BROKERAGE_AGENTS_FIXTURE.reduce((sum, a) => sum + a.closings, 0) /
      BROKERAGE_AGENTS_FIXTURE.length
  );
  const brokerageValues = scaleClosingsTrendToAgentTotal(brokerageAvgClosings).map((p) =>
    Math.max(1, p.value)
  );

  return [
    {
      name: agent.name,
      values: agentValues,
      color: color("chart.1"),
    },
    {
      name: "Brokerage Average",
      values: brokerageValues,
      color: color("text.muted"),
    },
  ];
}

function buildPeerBenchmarks(
  agent: BrokerageAnalyticsAgent,
  forensicsAgent: (typeof BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent)[0] | null
): AgentPeerBenchmarks {
  // Compute brokerage averages from fixture cohort
  const brokerageAvgs = BROKERAGE_AGENTS_FIXTURE.reduce(
    (acc, a) => ({
      closings: acc.closings + a.closings,
      volume: acc.volume + a.volumeDollars,
      gci: acc.gci + a.gci,
    }),
    { closings: 0, volume: 0, gci: 0 }
  );

  const agentCount = BROKERAGE_AGENTS_FIXTURE.length;

  // Compute fall-through average from forensics fixture
  const forensicsWithData = BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent.filter(
    (a) => a.fall_through_rate_percent != null
  );
  const avgFallThrough =
    forensicsWithData.length > 0
      ? forensicsWithData.reduce((sum, a) => sum + a.fall_through_rate_percent, 0) /
        forensicsWithData.length
      : 4.9; // Use summary rate as fallback

  return {
    closings: {
      agent: agent.closings,
      brokerageAvg: Math.round(brokerageAvgs.closings / agentCount),
    },
    volume: {
      agent: agent.volumeDollars,
      brokerageAvg: Math.round(brokerageAvgs.volume / agentCount),
    },
    gci: {
      agent: agent.gci,
      brokerageAvg: Math.round(brokerageAvgs.gci / agentCount),
    },
    fallThroughRate: {
      agent: forensicsAgent?.fall_through_rate_percent ?? null,
      brokerageAvg: Math.round(avgFallThrough * 10) / 10,
    },
  };
}

function buildAncillaryData(
  leakageAgent: (typeof BROKERAGE_ANCILLARY_FIXTURE.by_agent)[0] | null,
  engagementAgent: (typeof BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE.flagged_agents)[0] | null
): AgentAncillaryData {
  const services: AgentAncillaryData["services"] = [];

  if (engagementAgent) {
    // Use engagement data when available (more complete)
    services.push(
      {
        service: "Title",
        agentRate: engagementAgent.attach_rates.title,
        brokerageAvg: ANCILLARY_ATTACH_RATES.title,
      },
      {
        service: "Lending",
        agentRate: engagementAgent.attach_rates.lending,
        brokerageAvg: ANCILLARY_ATTACH_RATES.lending,
      },
      {
        service: "Escrow",
        agentRate: engagementAgent.attach_rates.escrow,
        brokerageAvg: ANCILLARY_ATTACH_RATES.escrow,
      },
      {
        service: "Home Warranty",
        agentRate: engagementAgent.attach_rates.home_warranty,
        brokerageAvg: ANCILLARY_ATTACH_RATES.home_warranty,
      }
    );
  } else if (leakageAgent) {
    // Fallback to ancillary data (title + lending only)
    services.push(
      {
        service: "Title",
        agentRate: leakageAgent.title_attach,
        brokerageAvg: ANCILLARY_ATTACH_RATES.title,
      },
      {
        service: "Lending",
        agentRate: leakageAgent.lending_attach,
        brokerageAvg: ANCILLARY_ATTACH_RATES.lending,
      }
    );
  }

  return {
    services,
    totalLeakage: leakageAgent?.total_leakage_dollars ?? 0,
  };
}

function buildForensicsData(
  forensicsAgent: (typeof BROKERAGE_DEAL_FAILURE_FIXTURE.by_agent)[0] | null
): AgentForensicsData {
  if (!forensicsAgent) {
    return {
      fallThroughRate: 0,
      cancelled: 0,
      totalDeals: 0,
      failureStages: [],
    };
  }

  // Use brokerage-wide failure stage distribution as agent's proportional share
  const stageDistribution = BROKERAGE_DEAL_FAILURE_FIXTURE.by_stage;
  const totalStageFailures = stageDistribution.reduce((sum, s) => sum + s.count, 0);

  const failureStages = stageDistribution.map((stage) => ({
    stage: stage.stage,
    share: totalStageFailures > 0 ? Math.round((stage.count / totalStageFailures) * 100) : 0,
  }));

  return {
    fallThroughRate: forensicsAgent.fall_through_rate_percent,
    cancelled: forensicsAgent.cancelled,
    totalDeals: forensicsAgent.total_deals,
    failureStages,
  };
}
