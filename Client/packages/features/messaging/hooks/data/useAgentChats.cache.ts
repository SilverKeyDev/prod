import type { QueryClient } from "@tanstack/react-query";

import type { AgentConversation } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { isSameMessagingUserId } from "packages/features/messaging/utils/userIdMatch";

export function resolveAgentChatsQueryKey(clientId: string | undefined) {
  if (clientId === undefined) {
    return queryKeys.agent.conversations();
  }
  return queryKeys.agent.conversation(clientId);
}

export function readCachedAgentConversations(
  queryClient: QueryClient,
  queryKey: ReturnType<typeof resolveAgentChatsQueryKey>,
  clientId: string | undefined
): AgentConversation[] | undefined {
  const cached = queryClient.getQueryData<AgentConversation[]>(queryKey);
  if (cached) {
    if (clientId) {
      return cached.filter((conv) => isSameMessagingUserId(conv.client_id, clientId));
    }
    return cached;
  }
  if (clientId !== undefined) {
    const cachedAll = queryClient.getQueryData<AgentConversation[]>(
      queryKeys.agent.conversations()
    );
    if (cachedAll) {
      return clientId
        ? cachedAll.filter((conv) => isSameMessagingUserId(conv.client_id, clientId))
        : cachedAll;
    }
  }
  return undefined;
}

export function buildConversationUnreadSignature(conversations: AgentConversation[]): string {
  let signature = "";
  for (const conv of conversations) {
    if (conv.unread_count !== undefined) {
      signature += `${conv.id}:${conv.unread_count}|`;
    }
  }
  return signature;
}
