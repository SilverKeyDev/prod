// Agent dashboard type definitions
import type { AgentClient } from "../../config/api";

export type DealStage = "search" | "touring" | "offer" | "under_contract" | "closing";

export type TodoPriority = "low" | "medium" | "high" | "urgent";

export type TodoType =
  | "deadline"
  | "follow_up"
  | "inspection"
  | "offer_expiration"
  | "closing"
  | "manual";

export type TodoItem = {
  id: string;
  title: string;
  due_date: string; // ISO date string
  priority: TodoPriority;
  client_id?: string;
  type: TodoType;
  completed: boolean;
  created_at: string;
};

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AlertType =
  | "offer_expires"
  | "inspection_due"
  | "client_waiting"
  | "deadline"
  | "risk";

export type UrgentAlert = {
  id: string;
  type: AlertType;
  message: string;
  client_id?: string;
  deadline?: string; // ISO date string
  severity: AlertSeverity;
  created_at: string;
};

export type RiskFlagType =
  | "financing"
  | "timeline"
  | "inspection"
  | "emotions"
  | "hoa"
  | "resale"
  | "appraisal"
  | "other";

export type RiskFlag = {
  type: RiskFlagType;
  message: string;
  severity: AlertSeverity;
};

export type ClientDealInfo = AgentClient & {
  deal_stage: DealStage;
  next_action?: string;
  last_agent_action?: string; // ISO date string
  risk_flags: RiskFlag[];
};

export type PreApprovalStatus = "not_started" | "in_progress" | "approved" | "denied" | "pending";

export type LoanType = "conventional" | "fha" | "va" | "usda" | "cash" | "other";

export type ClientFinancialSnapshot = {
  pre_approval_status: PreApprovalStatus;
  loan_type?: LoanType;
  cash_to_close?: number;
  pre_approval_amount?: number;
};

export type ClientGoals = {
  budget_min?: number;
  budget_max?: number;
  budget_stretch?: number;
  must_haves: string[];
  deal_breakers: string[];
  timeline_urgency: "low" | "medium" | "high";
};

export type DecisionLogEntry = {
  id: string;
  date: string; // ISO date string
  decision: string;
  context?: string;
  client_id: string;
};

export type AgentNote = {
  id: string;
  client_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type ClientTimelineEvent = {
  id: string;
  type: "offer" | "inspection" | "closing" | "deadline" | "other";
  title: string;
  date: string; // ISO date string
  description?: string;
  client_id: string;
};
