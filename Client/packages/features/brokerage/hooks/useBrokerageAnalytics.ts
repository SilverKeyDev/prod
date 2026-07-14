/**
 * Hook returning brokerage analytics overview + agents filtered by time period.
 * TanStack Query wrapper — fixture queryFn until OpenAPI live swap (SIL-207).
 */
import { useQuery } from "@tanstack/react-query";

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

export function useBrokerageAnalytics(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();

  const query = useQuery({
    queryKey: ["brokerage-analytics", "overview", brokerageOrgId, period],
    queryFn: async () => overviewResult(period),
    initialData: () => overviewResult(period),
    staleTime: 60_000,
  });

  return {
    data: query.data.data,
    agents: query.data.agents,
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
