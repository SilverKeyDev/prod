/**
 * Join production roster agents with ancillary leakage metrics for the shared
 * agent leaderboard modal.
 */
import type { BrokerageAnalyticsAgent } from "packages/features/brokerage/types/analytics";

export type AncillaryAgentMetrics = {
  agent_id: string;
  title_attach: number;
  lending_attach: number;
  total_leakage_dollars: number;
};

export type AgentLeaderboardRow = BrokerageAnalyticsAgent & {
  titleAttach: number | null;
  lendingAttach: number | null;
  totalOpportunityDollars: number | null;
};

export type AgentLeaderboardSort = "closings" | "opportunity";

export function buildAgentLeaderboardRows(
  agents: readonly BrokerageAnalyticsAgent[],
  ancillaryByAgent: readonly AncillaryAgentMetrics[],
  sort: AgentLeaderboardSort = "closings"
): AgentLeaderboardRow[] {
  const byId = new Map(ancillaryByAgent.map((a) => [a.agent_id, a]));

  const rows: AgentLeaderboardRow[] = agents.map((agent) => {
    const ancillary = byId.get(agent.id);
    return {
      ...agent,
      titleAttach: ancillary?.title_attach ?? null,
      lendingAttach: ancillary?.lending_attach ?? null,
      totalOpportunityDollars: ancillary?.total_leakage_dollars ?? null,
    };
  });

  if (sort === "opportunity") {
    return rows.sort((a, b) => {
      const oppDiff = (b.totalOpportunityDollars ?? -1) - (a.totalOpportunityDollars ?? -1);
      if (oppDiff !== 0) return oppDiff;
      if (b.closings !== a.closings) return b.closings - a.closings;
      return a.name.localeCompare(b.name);
    });
  }

  return rows.sort((a, b) => {
    if (b.closings !== a.closings) return b.closings - a.closings;
    if (b.gci !== a.gci) return b.gci - a.gci;
    return a.name.localeCompare(b.name);
  });
}
