/**
 * Brokerage analytics DTOs — mirror fixture / planned API response shapes.
 * Hand-typed until OpenAPI schemas cover `/api/v1/brokerage/analytics/*`.
 */
import type {
  BrokerageAgentFixture,
  BrokerageAgentRetentionFixture,
  BrokerageAnalyticsFixture,
  BrokerageAncillaryFixture,
  BrokerageDealFailureFixture,
  BrokerageTargetedEngagementFixture,
} from "packages/features/brokerage/utils/brokerageAnalyticsFixtures";

/** Overview payload (UI-shaped; no success envelope). */
export type BrokerageAnalyticsOverview = BrokerageAnalyticsFixture;

/** Agent performance row. */
export type BrokerageAnalyticsAgent = BrokerageAgentFixture;

/** Ancillary capture leakage payload. */
export type AncillaryAnalytics = BrokerageAncillaryFixture;

/** Deal failure forensics payload. */
export type DealFailureForensics = BrokerageDealFailureFixture;

/** Agent retention risk payload. */
export type AgentRetentionRisk = BrokerageAgentRetentionFixture;

/** Targeted agent engagement payload. */
export type TargetedAgentEngagement = BrokerageTargetedEngagementFixture;

export type BrokerageAnalyticsOverviewResult = {
  data: BrokerageAnalyticsOverview;
  agents: BrokerageAnalyticsAgent[];
};
