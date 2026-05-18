import type { AgentConversation } from "packages/api";

import type { AgentConnectionRequest } from "@/features/agent/api/agent";

import {
  type AgentConnectionDisplayStatus,
  indexInitiatedRequestsByAgentId,
  resolveAgentConnectionDisplayStatus,
} from "./connectionRequestStatus";

export type AgentRelationshipSummary = {
  agentId: string;
  displayName: string;
  email: string | null;
  profilePictureUrl: string | null;
  connectionStatus: AgentConnectionDisplayStatus;
};

/** Agents with pending, accepted, or declined connection state (not discoverable as new). */
export function hasAgentConnectionRelationship(status: AgentConnectionDisplayStatus): boolean {
  return status !== "none";
}

/**
 * All agents the buyer has an active relationship with: messaging connections plus
 * outstanding or terminal connection requests initiated by the buyer.
 */
export function listAgentRelationshipSummaries(
  conversations: readonly AgentConversation[],
  initiatedRequests: readonly AgentConnectionRequest[]
): AgentRelationshipSummary[] {
  const connectedAgentIds = new Set(
    conversations.map((c) => c.agent_id).filter((id): id is string => Boolean(id))
  );
  const initiatedByAgentId = indexInitiatedRequestsByAgentId([...initiatedRequests]);
  const byAgent = new Map<string, AgentRelationshipSummary>();

  for (const conversation of conversations) {
    const agentId = conversation.agent_id;
    if (!agentId) continue;
    const connectionStatus = resolveAgentConnectionDisplayStatus(
      agentId,
      connectedAgentIds,
      initiatedByAgentId
    );
    if (!hasAgentConnectionRelationship(connectionStatus)) continue;
    byAgent.set(agentId, {
      agentId,
      displayName: conversation.agent_name?.trim() || "Agent",
      email: conversation.agent_email ?? null,
      profilePictureUrl: conversation.agent_profile_picture ?? null,
      connectionStatus,
    });
  }

  for (const [agentId, request] of initiatedByAgentId) {
    if (byAgent.has(agentId)) continue;
    const connectionStatus = resolveAgentConnectionDisplayStatus(
      agentId,
      connectedAgentIds,
      initiatedByAgentId
    );
    if (!hasAgentConnectionRelationship(connectionStatus)) continue;
    byAgent.set(agentId, {
      agentId,
      displayName: request.other_party_name?.trim() || "Agent",
      email: request.other_party_email ?? null,
      profilePictureUrl: null,
      connectionStatus,
    });
  }

  return [...byAgent.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
  );
}
