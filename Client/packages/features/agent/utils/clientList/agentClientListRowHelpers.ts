import type { AgentClient, AgentConversation } from "packages/api";

import { getClientListActionInput } from "./clientListActionPriority";

export function agentClientActionFromConversation(
  client: AgentClient,
  conversation?: AgentConversation | null
) {
  return getClientListActionInput(client, conversation?.unread_count);
}
