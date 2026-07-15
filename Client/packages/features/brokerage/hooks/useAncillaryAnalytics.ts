/**
 * Hook returning brokerage ancillary capture analytics filtered by time period.
 * Powers SIL-277 — primary sales document for SkySlope engagement.
 */
import { useQuery } from "@tanstack/react-query";

import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

import { useBrokerageOrgId } from "./useBrokerageOrgId";

import { fetchAncillaryAnalytics } from "../api/analytics";

export { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";

export function useAncillaryAnalytics(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();

  const query = useQuery({
    queryKey: ["brokerage-analytics", "ancillary", brokerageOrgId, period],
    queryFn: brokerageOrgId
      ? () => fetchAncillaryAnalytics({ brokerageOrgId, timeline: period })
      : async () => buildAncillaryData(period),
    initialData: () => buildAncillaryData(period),
    staleTime: 60_000,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
