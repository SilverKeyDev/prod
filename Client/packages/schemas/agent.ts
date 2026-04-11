/**
 * Agent domain types and schemas.
 *
 * Purpose:
 *   Shared type definitions for agent-client relationships, deal tracking, risk assessment,
 *   and agent dashboard features. Used by agent feature components, hooks, and API clients.
 *
 * Consumers:
 *   - packages/features/agent/ (components, hooks, API)
 *   - packages/features/dashboard/ (agent views)
 *   - apps/web/pages/ (agent dashboard, client hub)
 *
 * Stability:
 *   - Core types (DealStage, AgentClient) are stable
 *   - Deal metadata types (ClientDealInfo, RiskFlag) are evolving with deal pipeline features
 *   - New fields added to ClientDealInfo and RiskFlag as deal tracking expands
 *
 * Related:
 *   - packages/features/agent/api/agent.ts (API client for agent endpoints)
 *   - packages/features/agent/types/ (additional agent-specific types)
 */

import type { AgentClient } from "packages/features/agent/api/agent";

export type DealStage =
  | "search"
  | "touring"
  | "offer"
  | "under_contract"
  | "closing";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type RiskFlag = {
  type:
    | "financing"
    | "timeline"
    | "inspection"
    | "emotions"
    | "hoa"
    | "resale"
    | "appraisal"
    | "other";
  message: string;
  severity: AlertSeverity;
};

/** Agent client row plus mock deal metadata from `enhanceClientWithDealInfo`. */
export type ClientDealInfo = AgentClient & {
  deal_stage: DealStage;
  next_action: string;
  last_agent_action: string;
  risk_flags: RiskFlag[];
};

export type ClientFinancialSnapshot = {
  pre_approval_status:
    | "not_started"
    | "in_progress"
    | "approved"
    | "denied"
    | "pending";
  loan_type: string;
  cash_to_close: number;
  pre_approval_amount: number;
};

export type ClientGoals = {
  budget_min: number;
  budget_max: number;
  budget_stretch: number;
  must_haves: string[];
  deal_breakers: string[];
  timeline_urgency: "low" | "medium" | "high";
};

export type ClientTimelineEvent = {
  id: string;
  type: "offer" | "inspection" | "closing" | string;
  title: string;
  date: string;
  description: string;
  client_id: string;
};

export type DecisionLogEntry = {
  id: string;
  date: string;
  decision: string;
  context: string;
  client_id: string;
};

export type AgentNote = {
  id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};
