import { dateParseLenient } from "packages/utils/date";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";

/** User-facing connection state for an agent row in discovery/search. */
export type AgentConnectionDisplayStatus = "none" | "pending" | "accepted" | "declined";

function requestTimestamp(req: AgentConnectionRequest): number {
  const raw = req.created_at;
  if (!raw) return 0;
  const d = dateParseLenient(raw);
  return d.isValid() ? d.valueOf() : 0;
}

/** Latest initiated request per agent (by `created_at`). */
export function indexInitiatedRequestsByAgentId(
  requests: AgentConnectionRequest[]
): Map<string, AgentConnectionRequest> {
  const byAgent = new Map<string, AgentConnectionRequest>();
  for (const req of requests) {
    const agentId = req.agent_id;
    if (!agentId) continue;
    const prev = byAgent.get(agentId);
    if (!prev || requestTimestamp(req) >= requestTimestamp(prev)) {
      byAgent.set(agentId, req);
    }
  }
  return byAgent;
}

export function resolveAgentConnectionDisplayStatus(
  agentId: string,
  connectedAgentIds: ReadonlySet<string>,
  initiatedByAgentId: Map<string, AgentConnectionRequest>
): AgentConnectionDisplayStatus {
  if (connectedAgentIds.has(agentId)) {
    return "accepted";
  }
  const req = initiatedByAgentId.get(agentId);
  if (!req) {
    return "none";
  }
  if (req.status === "pending") {
    return "pending";
  }
  if (req.status === "accepted") {
    return "accepted";
  }
  if (req.status === "rejected") {
    return "declined";
  }
  return "none";
}

export function canSendConnectionRequest(status: AgentConnectionDisplayStatus): boolean {
  return status === "none" || status === "declined";
}
