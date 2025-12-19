import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { agentService } from "../../services/agent";
import { queryKeys } from "../../config/query/keys";
import { useAuthStore } from "../../store/auth.slice";
import type {
  AgentConversation,
  AgentChatMessage,
} from "../../config/api/agent";

export type UseAgentChatsReturn = {
  conversations: AgentConversation[];
  isLoading: boolean;
  error: string | null;
  refreshChats: () => Promise<void>;
  sendMessage: (conversationId: string, message: string, clientId?: string, sharedHomeId?: string) => Promise<void>;
  getChatHistory: (
    conversationId: string
  ) => Promise<{ messages: AgentChatMessage[]; conversation?: AgentConversation }>;
  isSendingMessage: boolean;
};

/**
 * Hook to manage agent conversations
 * Works for both agents and clients
 */
export function useAgentChats(clientId?: string): UseAgentChatsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Fetch conversations
  const {
    data: conversations,
    isLoading,
    error,
    refetch: refetchChats,
  } = useQuery({
    queryKey: queryKeys.agent.conversation(clientId),
    queryFn: async () => {
      return await agentService.fetchChats(clientId);
    },
    enabled: authReady && isAuthenticated,
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchOnMount: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message,
      clientId,
      sharedHomeId,
    }: {
      conversationId: string;
      message: string;
      clientId?: string;
      sharedHomeId?: string;
    }) => {
      return await agentService.sendMessage(conversationId, message, clientId, sharedHomeId);
    },
    onSuccess: () => {
      // Invalidate conversations and history after sending a message
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.conversations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.all,
      });
    },
  });

  // Get chat history mutation
  const getChatHistoryMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await agentService.getChatHistory(conversationId);
    },
  });

  const refreshChats = useCallback(async () => {
    await refetchChats();
  }, [refetchChats]);

  const sendMessage = useCallback(
    async (conversationId: string, message: string, clientId?: string, sharedHomeId?: string) => {
      await sendMessageMutation.mutateAsync({ conversationId, message, clientId, sharedHomeId });
    },
    [sendMessageMutation]
  );

  const getChatHistory = useCallback(
    async (conversationId: string) => {
      return await getChatHistoryMutation.mutateAsync(conversationId);
    },
    [getChatHistoryMutation]
  );

  return {
    conversations: conversations ?? [],
    isLoading,
    error: error?.message ?? null,
    refreshChats,
    sendMessage,
    getChatHistory,
    isSendingMessage: sendMessageMutation.isPending,
  };
}
