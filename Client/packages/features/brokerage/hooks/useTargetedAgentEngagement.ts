/**
 * Hook returning targeted agent engagement data.
 * Identifies agents with 0% or bottom-quartile ancillary attach rates
 * despite high transaction volume, and surfaces suggested engagement actions
 * for brokerage admins to act on.
 *
 * Currently returns dummy fixtures shaped exactly like the real API response.
 * TODO SIL-272: Swap fixture for real API call once SkySlope sync lands:
 *   const res = await fetch(`/api/v1/brokerage/analytics/targeted-agent-engagement?brokerage_org_id=${brokerageOrgId}`);
 *   return res.json();
 *
 * Powers SIL-279 — targeted agent engagement panel.
 */
import { BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE } from "../fixtures/brokerageAnalyticsFixtures";

export function useTargetedAgentEngagement() {
  return {
    data: BROKERAGE_TARGETED_ENGAGEMENT_FIXTURE,
    isLoading: false,
    error: null,
  };
}