/**
 * Hook returning agent retention risk scoring filtered by time period.
 * Powers SIL-278 — agent retention risk panel.
 * SIL-207: real API with fixture fallback + placeholderData fix.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchAgentRetentionRisk } from "packages/features/brokerage/api/analytics";
import { buildRetentionData } from "packages/features/brokerage/utils/analytics/engagementTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { useBrokerageOrgId } from "./useBrokerageOrgId";

export { buildRetentionData } from "packages/features/brokerage/utils/analytics/engagementTransforms";

function adaptRetentionResponse(serverData: Record<string, unknown>, period: TimePeriod) {
  const fixture = buildRetentionData(period);
  return {
    ...fixture,
    ...(serverData as object),
    summary: { ...fixture.summary, ...((serverData.summary as object) ?? {}) },
    agents: Array.isArray(serverData.agents) && serverData.agents.length > 0
      ? serverData.agents : fixture.agents,
    market_benchmarks: Array.isArray(serverData.market_benchmarks) && serverData.market_benchmarks.length > 0
      ? serverData.market_benchmarks : fixture.market_benchmarks,
    methodology: (serverData.methodology as string) ?? fixture.methodology,
  };
}

export function useAgentRetentionRisk(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();
  const query = useQuery({
    queryKey: ["brokerage-analytics", "agent-retention-risk", brokerageOrgId, period],
    queryFn: brokerageOrgId
      ? async () => {
          const res = await fetchAgentRetentionRisk({ brokerageOrgId, timeline: period });
          return adaptRetentionResponse(res as Record<string, unknown>, period);
        }
      : async () => buildRetentionData(period),
    placeholderData: () => buildRetentionData(period),
    staleTime: 60_000,
  });
  return {
    data: query.data ?? buildRetentionData(period),
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}