// Mock data service for agent dashboard
// This will be replaced with real API calls when backend is ready
import type { AgentClient } from "packages/config/api";
import { dateNow } from "packages/utils/date";

import type {
  AgentNote,
  ClientDealInfo,
  ClientFinancialSnapshot,
  ClientGoals,
  ClientTimelineEvent,
  DealStage,
  DecisionLogEntry,
  RiskFlag,
  TodoItem,
  UrgentAlert,
} from "@/features/agent/types/agent";

/**
 * Generate mock todos for a client or all clients
 */
export function generateMockTodos(clients: AgentClient[], clientId?: string): TodoItem[] {
  const todos: TodoItem[] = [];
  const now = dateNow();

  clients.forEach((client) => {
    if (clientId && client.id !== clientId) return;

    // Add some sample todos
    todos.push({
      id: `todo-${client.id}-1`,
      title: `Follow up with ${client.name}`,
      due_date: now.add(24, "hour").toISOString(),
      priority: "medium",
      client_id: client.id,
      type: "follow_up",
      completed: false,
      created_at: now.toISOString(),
    });

    todos.push({
      id: `todo-${client.id}-2`,
      title: `Review offer for ${client.name}`,
      due_date: now.add(3, "hour").toISOString(),
      priority: "urgent",
      client_id: client.id,
      type: "offer_expiration",
      completed: false,
      created_at: now.toISOString(),
    });
  });

  return todos;
}

/**
 * Generate mock urgent alerts
 */
export function generateMockAlerts(clients: AgentClient[], clientId?: string): UrgentAlert[] {
  const alerts: UrgentAlert[] = [];
  const now = dateNow();

  clients.forEach((client) => {
    if (clientId && client.id !== clientId) return;

    // Add sample alerts
    alerts.push({
      id: `alert-${client.id}-1`,
      type: "offer_expires",
      message: `Offer expires in 3 hours for ${client.name}`,
      client_id: client.id,
      deadline: now.add(3, "hour").toISOString(),
      severity: "critical",
      created_at: now.toISOString(),
    });

    alerts.push({
      id: `alert-${client.id}-2`,
      type: "client_waiting",
      message: `${client.name} waiting on reply (24h+)`,
      client_id: client.id,
      severity: "high",
      created_at: now.subtract(25, "hour").toISOString(),
    });
  });

  return alerts;
}

/**
 * Enhance client with deal information
 */
export function enhanceClientWithDealInfo(
  client: AgentClient,
  dealStage: DealStage = "search"
): ClientDealInfo {
  const riskFlags: RiskFlag[] = [];

  // Add some sample risk flags
  if (dealStage === "offer") {
    riskFlags.push({
      type: "financing",
      message: "Pre-approval pending",
      severity: "medium",
    });
  }

  if (dealStage === "under_contract") {
    riskFlags.push({
      type: "inspection",
      message: "Inspection window closing soon",
      severity: "high",
    });
  }

  const lastAction = dateNow().subtract(2, "day"); // 2 days ago

  const nextActions: Record<DealStage, string> = {
    search: "Schedule property tour",
    touring: "Write offer",
    offer: "Review offer terms",
    under_contract: "Schedule inspection",
    closing: "Prepare closing documents",
  };

  return {
    ...client,
    deal_stage: dealStage,
    next_action: nextActions[dealStage],
    last_agent_action: lastAction.toISOString(),
    risk_flags: riskFlags,
  };
}

/**
 * Generate mock financial snapshot
 */
export function generateMockFinancialSnapshot(): ClientFinancialSnapshot {
  return {
    pre_approval_status: "approved",
    loan_type: "conventional",
    cash_to_close: 50000,
    pre_approval_amount: 500000,
  };
}

/**
 * Generate mock client goals
 */
export function generateMockClientGoals(): ClientGoals {
  return {
    budget_min: 300000,
    budget_max: 450000,
    budget_stretch: 500000,
    must_haves: ["3+ bedrooms", "2+ bathrooms", "Garage", "Good schools"],
    deal_breakers: ["Highway noise", "No yard", "HOA fees > $300"],
    timeline_urgency: "medium",
  };
}

/**
 * Generate mock decision log entries
 */
export function generateMockDecisionLog(clientId: string): DecisionLogEntry[] {
  const now = dateNow();
  return [
    {
      id: `decision-${clientId}-1`,
      date: now.subtract(5, "day").toISOString(),
      decision: "Client chose higher price over appraisal gap risk",
      context: "Property at 123 Main St",
      client_id: clientId,
    },
    {
      id: `decision-${clientId}-2`,
      date: now.subtract(2, "day").toISOString(),
      decision: "Decided to include inspection contingency",
      context: "Offer negotiation",
      client_id: clientId,
    },
  ];
}

/**
 * Generate mock notes
 */
export function generateMockNotes(clientId: string): AgentNote[] {
  const now = dateNow();
  return [
    {
      id: `note-${clientId}-1`,
      client_id: clientId,
      content: "Client prefers modern homes with open floor plans",
      created_at: now.subtract(7, "day").toISOString(),
      updated_at: now.subtract(7, "day").toISOString(),
    },
    {
      id: `note-${clientId}-2`,
      client_id: clientId,
      content: "Revisit condo idea if SFH fails",
      created_at: now.subtract(3, "day").toISOString(),
      updated_at: now.subtract(3, "day").toISOString(),
    },
  ];
}

/**
 * Generate mock timeline events
 */
export function generateMockTimelineEvents(clientId: string): ClientTimelineEvent[] {
  const now = dateNow();
  return [
    {
      id: `event-${clientId}-1`,
      type: "offer",
      title: "Offer submitted",
      date: now.subtract(3, "day").toISOString(),
      description: "Offer on 123 Main St",
      client_id: clientId,
    },
    {
      id: `event-${clientId}-2`,
      type: "inspection",
      title: "Inspection window",
      date: now.add(2, "day").toISOString(),
      description: "Inspection period ends",
      client_id: clientId,
    },
    {
      id: `event-${clientId}-3`,
      type: "closing",
      title: "Closing date",
      date: now.add(30, "day").toISOString(),
      description: "Scheduled closing",
      client_id: clientId,
    },
  ];
}
