// Mock data service for agent dashboard
// This will be replaced with real API calls when backend is ready
import type {
  TodoItem,
  UrgentAlert,
  ClientDealInfo,
  ClientFinancialSnapshot,
  ClientGoals,
  DealStage,
  RiskFlag,
  DecisionLogEntry,
  AgentNote,
  ClientTimelineEvent,
} from "../../schemas/agent/agent";
import type { AgentClient } from "../../config/api";

/**
 * Generate mock todos for a client or all clients
 */
export function generateMockTodos(
  clients: AgentClient[],
  clientId?: string,
): TodoItem[] {
  const todos: TodoItem[] = [];
  const now = new Date();

  clients.forEach((client) => {
    if (clientId && client.id !== clientId) return;

    // Add some sample todos
    todos.push({
      id: `todo-${client.id}-1`,
      title: `Follow up with ${client.name}`,
      due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      priority: "medium",
      client_id: client.id,
      type: "follow_up",
      completed: false,
      created_at: now.toISOString(),
    });

    todos.push({
      id: `todo-${client.id}-2`,
      title: `Review offer for ${client.name}`,
      due_date: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
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
export function generateMockAlerts(
  clients: AgentClient[],
  clientId?: string,
): UrgentAlert[] {
  const alerts: UrgentAlert[] = [];
  const now = new Date();

  clients.forEach((client) => {
    if (clientId && client.id !== clientId) return;

    // Add sample alerts
    alerts.push({
      id: `alert-${client.id}-1`,
      type: "offer_expires",
      message: `Offer expires in 3 hours for ${client.name}`,
      client_id: client.id,
      deadline: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      severity: "critical",
      created_at: now.toISOString(),
    });

    alerts.push({
      id: `alert-${client.id}-2`,
      type: "client_waiting",
      message: `${client.name} waiting on reply (24h+)`,
      client_id: client.id,
      severity: "high",
      created_at: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(),
    });
  });

  return alerts;
}

/**
 * Enhance client with deal information
 */
export function enhanceClientWithDealInfo(
  client: AgentClient,
  dealStage: DealStage = "search",
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

  const lastAction = new Date();
  lastAction.setDate(lastAction.getDate() - 2); // 2 days ago

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
  const now = new Date();
  return [
    {
      id: `decision-${clientId}-1`,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      decision: "Client chose higher price over appraisal gap risk",
      context: "Property at 123 Main St",
      client_id: clientId,
    },
    {
      id: `decision-${clientId}-2`,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
  const now = new Date();
  return [
    {
      id: `note-${clientId}-1`,
      client_id: clientId,
      content: "Client prefers modern homes with open floor plans",
      created_at: new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
    {
      id: `note-${clientId}-2`,
      client_id: clientId,
      content: "Revisit condo idea if SFH fails",
      created_at: new Date(
        now.getTime() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      updated_at: new Date(
        now.getTime() - 3 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  ];
}

/**
 * Generate mock timeline events
 */
export function generateMockTimelineEvents(
  clientId: string,
): ClientTimelineEvent[] {
  const now = new Date();
  return [
    {
      id: `event-${clientId}-1`,
      type: "offer",
      title: "Offer submitted",
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Offer on 123 Main St",
      client_id: clientId,
    },
    {
      id: `event-${clientId}-2`,
      type: "inspection",
      title: "Inspection window",
      date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Inspection period ends",
      client_id: clientId,
    },
    {
      id: `event-${clientId}-3`,
      type: "closing",
      title: "Closing date",
      date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Scheduled closing",
      client_id: clientId,
    },
  ];
}
