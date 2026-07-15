/**
 * Hook returning targeted agent engagement data filtered by time period.
 * Powers SIL-279 — targeted agent engagement panel.
 */
import { useQuery } from "@tanstack/react-query";

import { buildEngagementData } from "packages/features/brokerage/utils/analytics/engagementTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

import { useBrokerageOrgId } from "./useBrokerageOrgId";

export { buildEngagementData } from "packages/features/brokerage/utils/analytics/engagementTransforms";

export function useTargetedAgentEngagement(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();

  const query = useQuery({
    queryKey: ["brokerage-analytics", "targeted-agent-engagement", brokerageOrgId, period],
    queryFn: async () => buildEngagementData(period),
    initialData: () => buildEngagementData(period),
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
