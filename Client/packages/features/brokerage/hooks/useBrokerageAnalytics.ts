/**
 * Hook returning brokerage analytics overview + agents filtered by time period.
 * TanStack Query wrapper — real API when brokerageOrgId available, fixtures otherwise.
 * SIL-207: adapters transform server envelope → UI DTOs.
 */
import { useQuery } from "@tanstack/react-query";
import {
  fetchAgentAnalytics,
  fetchBrokerageAnalyticsOverview,
} from "packages/features/brokerage/api/analytics";
import {
  buildBrokerageAgents,
  buildBrokerageAnalyticsData,
} from "packages/features/brokerage/utils/analytics/overviewTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { useBrokerageOrgId } from "./useBrokerageOrgId";

export type { TimePeriod };
export {
  buildBrokerageAgents,
  buildBrokerageAnalyticsData,
} from "packages/features/brokerage/utils/analytics/overviewTransforms";

function overviewResult(period: TimePeriod) {
  return {
    data: buildBrokerageAnalyticsData(period),
    agents: buildBrokerageAgents(period),
  };
}

/**
 * Adapt server overview envelope → BrokerageAnalyticsOverview UI shape.
 * Server returns { success, overview: {...}, transaction_funnel: [...], agent_performance: [...] }
 * We merge into the fixture shape so the UI never sees missing fields.
 */
function adaptOverviewResponse(serverData: Record<string, unknown>, period: TimePeriod) {
  const fixture = buildBrokerageAnalyticsData(period);
  const serverOverview = (serverData.overview as Record<string, unknown>) ?? {};
  return {
    ...fixture,
    overview: {
      ...fixture.overview,
      activeAgents: (serverOverview.active_agents as number) ?? fixture.overview.activeAgents,
      openTransactions: (serverOverview.open_transactions as number) ?? fixture.overview.openTransactions,
      atRiskCount: (serverOverview.at_risk_agents as number) ?? fixture.overview.atRiskCount,
    },
    transactionFunnel: Array.isArray(serverData.transaction_funnel)
      ? (serverData.transaction_funnel as { stage: string; count: number; drop_off_percent?: number }[]).map((s) => ({
          stage: s.stage,
          count: s.count,
          dropOffPercent: s.drop_off_percent ?? 0,
          weightedForecast: s.count,
        }))
      : fixture.transactionFunnel,
  };
}

/**
 * Adapt server agents envelope → BrokerageAnalyticsAgent[] UI shape.
 * Server returns { success, agents: [{agent_id, name, active_clients, closings}] }
 */
function adaptAgentsResponse(serverData: Record<string, unknown>, period: TimePeriod) {
  const fixtureAgents = buildBrokerageAgents(period);
  if (!Array.isArray(serverData.agents) || serverData.agents.length === 0) {
    return fixtureAgents;
  }
  return (serverData.agents as { agent_id: string; name: string; active_clients: number; closings: number }[]).map(
    (a, i) => {
      const fixture = fixtureAgents[i % fixtureAgents.length];
      return {
        ...fixture,
        id: a.agent_id,
        name: a.name,
        activeClients: a.active_clients,
        closings: a.closings,
        status: (a.closings >= 30 ? "top" : a.closings <= 5 ? "at_risk" : "healthy") as "top" | "at_risk" | "healthy",
        stall: fixture?.stall ?? null,
      };
    }
  );
}

export function useBrokerageAnalytics(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();
  const query = useQuery({
    queryKey: ["brokerage-analytics", "overview", brokerageOrgId, period],
    queryFn: brokerageOrgId
      ? async () => {
          const [overviewRes, agentsRes] = await Promise.all([
            fetchBrokerageAnalyticsOverview({ brokerageOrgId, timeline: period }),
            fetchAgentAnalytics({ brokerageOrgId, timeline: period }),
          ]);
          return {
            data: adaptOverviewResponse(overviewRes as Record<string, unknown>, period),
            agents: adaptAgentsResponse(agentsRes as Record<string, unknown>, period),
          };
        }
      : async () => overviewResult(period),
    placeholderData: () => overviewResult(period),
    staleTime: 60_000,
  });
  return {
    data: query.data?.data ?? buildBrokerageAnalyticsData(period),
    agents: query.data?.agents ?? buildBrokerageAgents(period),
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}