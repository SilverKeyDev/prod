/**
 * Hook returning agent retention risk data filtered by time period.
 */
import { useQuery } from "@tanstack/react-query";

import { buildRetentionData } from "packages/features/brokerage/utils/analytics/engagementTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

import { useBrokerageOrgId } from "./useBrokerageOrgId";

export { buildRetentionData } from "packages/features/brokerage/utils/analytics/engagementTransforms";

export function useAgentRetentionRisk(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();

  const query = useQuery({
    queryKey: ["brokerage-analytics", "agent-retention-risk", brokerageOrgId, period],
    queryFn: async () => buildRetentionData(period),
    initialData: () => buildRetentionData(period),
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
