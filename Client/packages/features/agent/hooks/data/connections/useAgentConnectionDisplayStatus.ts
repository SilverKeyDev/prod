import { useCallback, useMemo } from "react";

import { useAgentChats } from "packages/features/messaging";

import type { AgentConnectionDisplayStatus } from "@/features/agent/utils/connectionRequestStatus";
import {
  indexInitiatedRequestsByAgentId,
  resolveAgentConnectionDisplayStatus,
} from "@/features/agent/utils/connectionRequestStatus";

import { useInitiatedConnectionRequests } from "./useInitiatedConnectionRequests";

export function useAgentConnectionDisplayStatus(enabled: boolean = true): {
  getConnectionStatus: (agentId: string) => AgentConnectionDisplayStatus;
} {
  const { requests: initiatedRequests } = useInitiatedConnectionRequests(enabled);
  const { conversations } = useAgentChats();

  const connectedAgentIds = useMemo(
    () => new Set(conversations.map((c) => c.agent_id).filter(Boolean)),
    [conversations]
  );

  const initiatedByAgentId = useMemo(
    () => indexInitiatedRequestsByAgentId(initiatedRequests),
    [initiatedRequests]
  );

  const getConnectionStatus = useCallback(
    (agentId: string) =>
      resolveAgentConnectionDisplayStatus(agentId, connectedAgentIds, initiatedByAgentId),
    [connectedAgentIds, initiatedByAgentId]
  );

  return { getConnectionStatus };
}
