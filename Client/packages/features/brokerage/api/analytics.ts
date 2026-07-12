/**
 * Thin brokerage analytics API client (SIL-274 timeline contract).
 * Typed against `types/analytics` DTOs for SIL-207 hook swap.
 */
import type {
  AgentRetentionRisk,
  AncillaryAnalytics,
  BrokerageAnalyticsAgent,
  BrokerageAnalyticsOverview,
  DealFailureForensics,
  TargetedAgentEngagement,
} from "packages/features/brokerage/types/analytics";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { apiGet } from "packages/services/http";

export type BrokerageAnalyticsQuery = {
  brokerageOrgId: string;
  timeline: TimePeriod;
};

function analyticsQueryPath(path: string, query: BrokerageAnalyticsQuery): string {
  const params = new URLSearchParams({
    brokerage_org_id: query.brokerageOrgId,
    timeline: query.timeline,
  });
  return `/api/v1/brokerage/analytics/${path}?${params.toString()}`;
}

export function fetchBrokerageAnalyticsOverview(query: BrokerageAnalyticsQuery) {
  return apiGet<BrokerageAnalyticsOverview>(analyticsQueryPath("overview", query));
}

export function fetchAncillaryAnalytics(query: BrokerageAnalyticsQuery) {
  return apiGet<AncillaryAnalytics>(analyticsQueryPath("ancillary", query));
}

export function fetchDealFailureForensics(query: BrokerageAnalyticsQuery) {
  return apiGet<DealFailureForensics>(analyticsQueryPath("deal-failure", query));
}

export function fetchAgentRetentionRisk(query: BrokerageAnalyticsQuery) {
  return apiGet<AgentRetentionRisk>(analyticsQueryPath("agent-retention-risk", query));
}

export function fetchTargetedAgentEngagement(query: BrokerageAnalyticsQuery) {
  return apiGet<TargetedAgentEngagement>(analyticsQueryPath("targeted-agent-engagement", query));
}

export function fetchVolumeAnalytics(query: BrokerageAnalyticsQuery) {
  return apiGet<BrokerageAnalyticsOverview["production"]>(analyticsQueryPath("volume", query));
}

export function fetchFunnelAnalytics(query: BrokerageAnalyticsQuery) {
  return apiGet<BrokerageAnalyticsOverview["transactionFunnel"]>(
    analyticsQueryPath("funnel", query)
  );
}

export function fetchAgentAnalytics(query: BrokerageAnalyticsQuery) {
  return apiGet<BrokerageAnalyticsAgent[]>(analyticsQueryPath("agents", query));
}

/** Exported for unit tests — builds the query string without network I/O. */
export function buildAnalyticsQueryUrl(path: string, query: BrokerageAnalyticsQuery): string {
  return analyticsQueryPath(path, query);
}
