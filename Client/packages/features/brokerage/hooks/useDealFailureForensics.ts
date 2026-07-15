/**
 * Hook returning brokerage deal failure forensics filtered by time period.
 * Powers SIL-281 — deal failure forensics panel.
 * SIL-207: real API with fixture fallback + response adapter.
 */
import { useQuery } from "@tanstack/react-query";
import { fetchDealFailureForensics } from "packages/features/brokerage/api/analytics";
import { buildFailureData } from "packages/features/brokerage/utils/analytics/dealFailureTransforms";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { useBrokerageOrgId } from "./useBrokerageOrgId";

function adaptDealFailureResponse(serverData: Record<string, unknown>, period: TimePeriod) {
  const fixture = buildFailureData(period);
  return {
    ...fixture,
    ...(serverData as object),
    summary: {
      ...fixture.summary,
      ...((serverData.summary as object) ?? {}),
    },
    cycleTime: (serverData.cycleTime as object) ?? fixture.cycleTime,
    trend: Array.isArray(serverData.trend) && serverData.trend.length > 0
      ? serverData.trend : fixture.trend,
    by_stage: Array.isArray(serverData.by_stage) && serverData.by_stage.length > 0
      ? serverData.by_stage : fixture.by_stage,
    by_agent: Array.isArray(serverData.by_agent) && serverData.by_agent.length > 0
      ? serverData.by_agent : fixture.by_agent,
    by_lender: Array.isArray(serverData.by_lender) && serverData.by_lender.length > 0
      ? serverData.by_lender : fixture.by_lender,
    by_price_band: Array.isArray(serverData.by_price_band) && serverData.by_price_band.length > 0
      ? serverData.by_price_band : fixture.by_price_band,
  };
}

export function useDealFailureForensics(period: TimePeriod = "all") {
  const brokerageOrgId = useBrokerageOrgId();
  const query = useQuery({
    queryKey: ["brokerage-analytics", "deal-failure", brokerageOrgId, period],
    queryFn: brokerageOrgId
      ? async () => {
          const res = await fetchDealFailureForensics({ brokerageOrgId, timeline: period });
          return adaptDealFailureResponse(res as Record<string, unknown>, period);
        }
      : async () => buildFailureData(period),
    placeholderData: () => buildFailureData(period),
    staleTime: 60_000,
  });
  return {
    data: query.data ?? buildFailureData(period),
    isLoading: query.isLoading && !query.data,
    error: query.error ?? null,
  };
}