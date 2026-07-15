/**
 * Hook returning targeted agent engagement data filtered by time period.
 * Powers SIL-279 — targeted agent engagement panel.
 * SIL-207: real API with fixture fallback + placeholderData fix.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchTargetedAgentEngagement } from "packages/features/brokerage/api/analytics";
import { buildEngagementData } from "packages/features/brokerage/utils/analytics/engagementTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { useBrokerageOrgId } from "./useBrokerageOrgId";

export { buildEngagementData } from "packages/features/brokerage/utils/analytics/engagementTransforms";

function adaptEngagementResponse(serverData: Record<string, unknown>, period: TimePeriod) {
  const fixture = buildEngagementData(period);
  return {
    ...fixture,
    ...(serverData as object),
    summary: { ...fixture.summary, ...((serverData.summary as object) ?? {}) },
    flagged_agents: Array.isArray(serverData.flagged_agents) && serverData.flagged_agents.length > 0
      ? serverData.flagged_agents
      : fixture.flagged_agents,
    by_service_gap: Array.isArray(serverData.by_service_gap) && serverData.by_service_gap.length > 0
      ? serverData.by_service_gap
      : fixture.by_service_gap,
  };
}

export function useTargetedAgentEngagement(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();
  const query = useQuery({
    queryKey: ["brokerage-analytics", "targeted-agent-engagement", brokerageOrgId, period],
    queryFn: brokerageOrgId
      ? async () => {
          const res = await fetchTargetedAgentEngagement({ brokerageOrgId, timeline: period });
          return adaptEngagementResponse(res as Record<string, unknown>, period);
        }
      : async () => buildEngagementData(period),
    placeholderData: () => buildEngagementData(period),
    staleTime: 60_000,
  });
  return {
    data: query.data ?? buildEngagementData(period),
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}