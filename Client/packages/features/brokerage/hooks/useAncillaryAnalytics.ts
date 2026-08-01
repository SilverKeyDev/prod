/**
 * Hook returning brokerage ancillary capture analytics filtered by time period.
 * Powers SIL-277 — primary sales document for SkySlope engagement.
 * SIL-207: real API with fixture fallback + response adapter.
 */
import { useQuery } from "@tanstack/react-query";

import { fetchAncillaryAnalytics } from "packages/features/brokerage/api/analytics";
import { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";

import { useBrokerageOrgId } from "./useBrokerageOrgId";

export { buildAncillaryData } from "packages/features/brokerage/utils/analytics/ancillaryTransforms";

/**
 * Merge server ancillary response with fixture defaults.
 * Server may omit industry_avg_percent, industry_high_percent,
 * opportunity_vs_avg_dollars, opportunity_vs_high_dollars — default them.
 */
function adaptAncillaryResponse(serverData: Record<string, unknown>, period: TimePeriod) {
  const fixture = buildAncillaryData(period);
  return {
    ...fixture,
    ...(serverData as object),
    summary: {
      ...fixture.summary,
      ...((serverData.summary as object) ?? {}),
    },
    by_service: Array.isArray(serverData.by_service)
      ? serverData.by_service.map((svc: Record<string, unknown>, i: number) => {
          const fixtureSvc = fixture.by_service[i % fixture.by_service.length];
          return {
            ...fixtureSvc,
            ...svc,
            industry_avg_percent:
              svc.industry_avg_percent ?? fixtureSvc?.industry_avg_percent ?? 55,
            industry_high_percent:
              svc.industry_high_percent ?? fixtureSvc?.industry_high_percent ?? 75,
            opportunity_vs_avg_dollars:
              svc.opportunity_vs_avg_dollars ?? fixtureSvc?.opportunity_vs_avg_dollars ?? 0,
            opportunity_vs_high_dollars:
              svc.opportunity_vs_high_dollars ?? fixtureSvc?.opportunity_vs_high_dollars ?? 0,
          };
        })
      : fixture.by_service,
    by_agent:
      Array.isArray(serverData.by_agent) && serverData.by_agent.length > 0
        ? serverData.by_agent
        : fixture.by_agent,
  };
}

export function useAncillaryAnalytics(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();
  const query = useQuery({
    queryKey: ["brokerage-analytics", "ancillary", brokerageOrgId, period],
    queryFn: brokerageOrgId
      ? async () => {
          const res = await fetchAncillaryAnalytics({ brokerageOrgId, timeline: period });
          return adaptAncillaryResponse(res as Record<string, unknown>, period);
        }
      : async () => buildAncillaryData(period),
    placeholderData: () => buildAncillaryData(period),
    staleTime: 60_000,
  });
  return {
    data: query.data ?? buildAncillaryData(period),
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}
