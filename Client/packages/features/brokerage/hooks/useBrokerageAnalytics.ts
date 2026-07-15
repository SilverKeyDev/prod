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

import { fetchBrokerageAnalyticsOverview, fetchAgentAnalytics } from "../api/analytics";

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
    queryFn: brokerageOrgId
      ? async () => {
        const [overview, agents] = await Promise.all([
          fetchBrokerageAnalyticsOverview({ brokerageOrgId, timeline: period }),
          fetchAgentAnalytics({ brokerageOrgId, timeline: period }),
        ]);
        return { data: overview, agents };
      }
      : async () => overviewResult(period),
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
