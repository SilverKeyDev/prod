/**
 * Hook returning brokerage deal failure forensics filtered by time period.
 * Powers SIL-281 — deal failure forensics panel.
 */
import { useQuery } from "@tanstack/react-query";

import { buildFailureData } from "packages/features/brokerage/utils/analytics/dealFailureTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

import { useBrokerageOrgId } from "./useBrokerageOrgId";

export { buildFailureData } from "packages/features/brokerage/utils/analytics/dealFailureTransforms";

export function useDealFailureForensics(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();

  const query = useQuery({
    queryKey: ["brokerage-analytics", "deal-failure", brokerageOrgId, period],
    queryFn: async () => buildFailureData(period),
    initialData: () => buildFailureData(period),
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
