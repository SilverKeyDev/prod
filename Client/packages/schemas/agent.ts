import type { AgentClient } from "packages/features/agent/api/agent";

export type DealStage = "search" | "touring" | "offer" | "under_contract" | "closing";

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
  pre_approval_status: "not_started" | "in_progress" | "approved" | "denied" | "pending";
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

export type UrgentAlert = {
  id: string;
  type: string;
  message: string;
  client_id: string;
  deadline: string;
  severity: AlertSeverity;
  created_at: string;
};
