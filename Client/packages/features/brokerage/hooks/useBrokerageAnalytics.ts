/**
 * Hook returning brokerage analytics data.
 * Currently returns dummy fixtures — swap `data` source for real API call when SIL-202 lands.
 * Shape mirrors planned GET /api/v1/brokerage/analytics/overview response.
 */
import {
  BROKERAGE_AGENTS_FIXTURE,
  BROKERAGE_ANALYTICS_FIXTURE,
} from "../fixtures/brokerageAnalyticsFixtures";

export function useBrokerageAnalytics() {
  return {
    data: BROKERAGE_ANALYTICS_FIXTURE,
    agents: BROKERAGE_AGENTS_FIXTURE,
    isLoading: false,
  };
}
