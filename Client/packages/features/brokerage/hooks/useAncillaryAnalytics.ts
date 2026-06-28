/**
 * Hook returning brokerage ancillary capture analytics.
 * Shows attach rates and dollar leakage by service and agent.
 *
 * Currently returns dummy fixtures shaped exactly like the real API response.
 * TODO SIL-272: Swap fixture for real API call once SkySlope sync lands:
 *   const res = await fetch(`/api/v1/brokerage/analytics/ancillary?brokerage_org_id=${brokerageOrgId}`);
 *   return res.json();
 *
 * Powers SIL-277 — primary sales document for SkySlope engagement.
 */
import { BROKERAGE_ANCILLARY_FIXTURE } from "../fixtures/brokerageAnalyticsFixtures";

export function useAncillaryAnalytics() {
  return {
    data: BROKERAGE_ANCILLARY_FIXTURE,
    isLoading: false,
    error: null,
  };
}
