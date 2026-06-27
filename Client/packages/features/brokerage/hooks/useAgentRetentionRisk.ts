/**
 * Hook returning agent retention risk scoring data.
 * Cross-references agent split structures against production volume to flag
 * flight-risk agents (top producers underpaid vs market) and over-compensated
 * agents (high split, low volume). Ranked by risk score.
 *
 * Currently returns dummy fixtures shaped exactly like the real API response.
 * TODO SIL-272: Swap fixture for real API call once SkySlope sync lands:
 *   const res = await fetch(`/api/v1/brokerage/analytics/agent-retention-risk?brokerage_org_id=${brokerageOrgId}`);
 *   return res.json();
 * TODO SIL-191: Pull real split structures from brokerage agent roster config.
 *
 * Powers SIL-278 — agent retention risk panel.
 */
import { BROKERAGE_AGENT_RETENTION_FIXTURE } from "../fixtures/brokerageAnalyticsFixtures";

export function useAgentRetentionRisk() {
  return {
    data: BROKERAGE_AGENT_RETENTION_FIXTURE,
    isLoading: false,
    error: null,
  };
}