/**
 * Hook returning brokerage deal failure forensics.
 * Shows fall-through rates by agent, lender, price band, and stage
 * so brokerages can make informed vendor and coaching decisions.
 *
 * Currently returns dummy fixtures shaped exactly like the real API response.
 * TODO SIL-272: Swap fixture for real API call once SkySlope sync lands:
 *   const res = await fetch(`/api/v1/brokerage/analytics/deal-failure?brokerage_org_id=${brokerageOrgId}`);
 *   return res.json();
 *
 * Powers SIL-281 — deal failure forensics panel.
 */
import { BROKERAGE_DEAL_FAILURE_FIXTURE } from "../fixtures/brokerageAnalyticsFixtures";

export function useDealFailureForensics() {
  return {
    data: BROKERAGE_DEAL_FAILURE_FIXTURE,
    isLoading: false,
    error: null,
  };
}
