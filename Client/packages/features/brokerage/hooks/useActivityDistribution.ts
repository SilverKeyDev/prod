/**
 * Hook returning scaled week/month/year activity distribution series.
 */
import { useQuery } from "@tanstack/react-query";

import { buildActivityDistribution } from "packages/features/brokerage/utils/analytics/activityDistributionTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

export function useActivityDistribution(period: TimePeriod = "all") {
  const query = useQuery({
    queryKey: ["brokerage-analytics", "activity-distribution", period],
    queryFn: async () => buildActivityDistribution(period),
    initialData: () => buildActivityDistribution(period),
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !query.data,
  };
}
