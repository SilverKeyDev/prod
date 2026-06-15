import type { QueryClient } from "@tanstack/react-query";

import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import type { AgentConversation } from "packages/features/agent/api/agent";
import { INITIAL_CHAT_HISTORY_LIMIT } from "packages/features/messaging/hooks/data/useAgentChats";
import { resolveApiResultErrorMessage } from "packages/utils/core/errorHandling";

export async function prefetchChatHistory(
  conversationId: string,
  queryClient: QueryClient
): Promise<void> {
  try {
    const cached = queryClient.getQueryData(queryKeys.agent.history(conversationId));

    if (cached) {
      return;
    }

    await queryClient.prefetchQuery({
      queryKey: queryKeys.agent.history(conversationId),
      queryFn: async () => {
        const response = await agentApi.getChatHistory(conversationId, {
          limit: INITIAL_CHAT_HISTORY_LIMIT,
        });
        if (!response.success) {
          throw new Error(resolveApiResultErrorMessage(response, "Failed to fetch chat history"));
        }
        return {
          messages: response.messages ?? [],
          conversation: response.conversation,
          has_more_older: response.has_more_older,
          has_more_newer: response.has_more_newer,
        };
      },
      staleTime: 3 * 60 * 1000,
    });
  } catch {
    // Silently fail
  }
}

export async function prefetchChatHistories(queryClient: QueryClient): Promise<void> {
  try {
    const conversations = queryClient.getQueryData<AgentConversation[]>(
      queryKeys.agent.conversations()
    );

    if (!conversations || conversations.length === 0) {
      return;
    }

    const historyPromises = conversations.map((conversation) =>
      prefetchChatHistory(conversation.id, queryClient)
    );

    await Promise.allSettled(historyPromises);
  } catch {
    // Don't throw - this is a performance optimization, not critical
  }
}
