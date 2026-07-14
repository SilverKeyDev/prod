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
import type {
  BrokerageInventoryResponse,
  InventoryStatusFilter,
} from "packages/features/brokerage/types/inventory";
import type { TimePeriod } from "packages/features/brokerage/utils/analyticsPeriod";
import { apiGet } from "packages/services/http";

export type BrokerageAnalyticsQuery = {
  brokerageOrgId: string;
  timeline: TimePeriod;
};

export type BrokerageInventoryQuery = {
  brokerageOrgId: string;
  status?: InventoryStatusFilter;
};

function analyticsQueryPath(path: string, query: BrokerageAnalyticsQuery): string {
  const params = new URLSearchParams({
    brokerage_org_id: query.brokerageOrgId,
    timeline: query.timeline,
  });
  return `/api/v1/brokerage/analytics/${path}?${params.toString()}`;
}

function inventoryQueryPath(query: BrokerageInventoryQuery): string {
  const params = new URLSearchParams({
    brokerage_org_id: query.brokerageOrgId,
  });
  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  }
  return `/api/v1/brokerage/analytics/inventory?${params.toString()}`;
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

export function fetchBrokerageInventory(query: BrokerageInventoryQuery) {
  return apiGet<BrokerageInventoryResponse>(inventoryQueryPath(query));
}

/** Exported for unit tests — builds the query string without network I/O. */
export function buildAnalyticsQueryUrl(path: string, query: BrokerageAnalyticsQuery): string {
  return analyticsQueryPath(path, query);
}

/** Exported for unit tests — builds the inventory query string without network I/O. */
export function buildInventoryQueryUrl(query: BrokerageInventoryQuery): string {
  return inventoryQueryPath(query);
}
