import { useCallback, useEffect, useMemo } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AgentChatMessage, AgentConversation } from "packages/api";
import { agentApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { showErrorToast } from "packages/hooks/ui/toast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import { useNotificationStore } from "packages/store";

export type UseAgentChatsReturn = {
  conversations: AgentConversation[];
  isLoading: boolean;
  error: string | null;
  refreshChats: () => Promise<void>;
  sendMessage: (
    conversationId: string,
    message: string,
    clientId?: string,
    sharedHomeId?: string,
    sharedDocumentId?: string
  ) => Promise<void>;
  getChatHistory: (conversationId: string) => Promise<{
    messages: AgentChatMessage[];
    conversation?: AgentConversation;
  }>;
  isSendingMessage: boolean;
  lastFetchedAt: number | null;
};

/**
 * Hook to manage agent conversations
 * Works for both agents and clients
 */
export function useAgentChats(clientId?: string): UseAgentChatsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const setTotalUnreadCount = useNotificationStore((s) => s.setTotalUnreadCount);

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);

  // Use the same query key as dataConfig when clientId is undefined
  // This ensures cache hits for prefetched data
  const queryKey = useMemo(() => {
    if (clientId === undefined) {
      // Match dataConfig's query key for prefetched data
      return queryKeys.agent.conversations();
    }
    // Use specific conversation key when clientId is provided
    return queryKeys.agent.conversation(clientId);
  }, [clientId]);

  // Check cache first to show data immediately
  const cachedConversations = useMemo(() => {
    if (!shouldLoadData) return undefined;
    // Check cache using the same query key
    const cached = queryClient.getQueryData<AgentConversation[]>(queryKey);
    if (cached) {
      // If clientId is provided, filter to that client's conversation
      if (clientId) {
        return cached.filter((conv) => conv.client_id === clientId);
      }
      return cached;
    }
    // Also check the general conversations cache (from prefetch) as fallback
    // This handles the case where dataConfig prefetched with conversations() key
    // but we're querying with conversation(clientId) key
    if (clientId !== undefined) {
      const cachedAll = queryClient.getQueryData<AgentConversation[]>(
        queryKeys.agent.conversations()
      );
      if (cachedAll) {
        return clientId ? cachedAll.filter((conv) => conv.client_id === clientId) : cachedAll;
      }
    }
    return undefined;
  }, [shouldLoadData, queryClient, queryKey, clientId]);

  // Fetch conversations
  const {
    data: conversationsResponse,
    isLoading,
    error,
    refetch: refetchChats,
    dataUpdatedAt,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await agentApi.getChats(clientId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch conversations");
      }
      return response.conversations ?? [];
    },
    enabled: shouldLoadData,
    // Use placeholderData to show cached data immediately
    placeholderData: (previousValue) => {
      // Return cached data if available, otherwise previous value
      return cachedConversations ?? previousValue;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes (override dataConfig's staleTime: 0 for instant loading)
    refetchOnMount: false,
    refetchOnWindowFocus: true, // Refetch when user returns to tab so new messages show
    refetchInterval: 30 * 1000, // Poll every 30s so receiving messages triggers rerender
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      message,
      clientId,
      sharedHomeId,
      sharedDocumentId,
    }: {
      conversationId: string;
      message: string;
      clientId?: string;
      sharedHomeId?: string;
      sharedDocumentId?: string;
    }) => {
      // Import log here to avoid circular dependencies
      const { log, LOG_CATEGORIES } = await import("packages/logger");

      log.debug(LOG_CATEGORIES.MESSAGES, "sendMessageMutation called", {
        conversationId,
        messageLength: message.length,
        hasClientId: !!clientId,
        hasSharedHomeId: !!sharedHomeId,
        hasSharedDocumentId: !!sharedDocumentId,
        clientId,
        sharedHomeId,
        sharedDocumentId,
      });

      const response = await agentApi.sendMessage(
        conversationId,
        message,
        clientId,
        sharedHomeId,
        sharedDocumentId
      );

      log.debug(LOG_CATEGORIES.MESSAGES, "sendMessage API response", {
        success: response.success,
        hasError: !!response.error,
        error: response.error,
        message_id: response.message_id,
      });

      if (!response.success) {
        throw new Error(response.error ?? "Failed to send message");
      }
      return response;
    },
    onSuccess: (_data, variables) => {
      // Invalidate conversations so list and last_message_at update
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.conversations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.all,
      });
      // Remove this conversation's history cache so the next load fetches fresh
      // (ensures chat rerenders with the new message for text, home, document, event)
      if (variables.conversationId !== "new") {
        void queryClient.removeQueries({
          queryKey: queryKeys.agent.history(variables.conversationId),
        });
      }
    },
    onError: (error) => {
      log.error(LOG_CATEGORIES.ERRORS, "Send message failed", error);
      showErrorToast("Failed to send message. Please try again.");
    },
  });

  // Get chat history mutation (caches results in React Query)
  const getChatHistoryMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await agentApi.getChatHistory(conversationId);
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch chat history");
      }
      const result = {
        messages: response.messages ?? [],
        conversation: response.conversation,
      };
      queryClient.setQueryData(queryKeys.agent.history(conversationId), result);
      return result;
    },
    onError: (error, conversationId) => {
      log.error(LOG_CATEGORIES.ERRORS, "Get chat history failed", {
        error,
        conversationId,
      });
      showErrorToast("Failed to load messages. Please try again.");
    },
  });

  const refreshChats = useCallback(async () => {
    await refetchChats();
  }, [refetchChats]);

  const sendMessage = useCallback(
    async (
      conversationId: string,
      message: string,
      clientId?: string,
      sharedHomeId?: string,
      sharedDocumentId?: string
    ) => {
      await sendMessageMutation.mutateAsync({
        conversationId,
        message,
        clientId,
        sharedHomeId,
        sharedDocumentId,
      });
    },
    [sendMessageMutation]
  );

  const getChatHistory = useCallback(
    async (conversationId: string) => {
      const historyKey = queryKeys.agent.history(conversationId);

      // Check cache first
      const cached = queryClient.getQueryData<{
        messages: AgentChatMessage[];
        conversation?: AgentConversation;
      }>(historyKey);

      if (cached) {
        // Return cached data immediately
        // Only fetch in background if cache is stale (using fetchQuery which respects staleTime)
        void queryClient
          .fetchQuery({
            queryKey: historyKey,
            queryFn: async () => {
              const response = await agentApi.getChatHistory(conversationId);
              if (!response.success) {
                throw new Error(response.error ?? "Failed to fetch chat history");
              }
              return {
                messages: response.messages ?? [],
                conversation: response.conversation,
              };
            },
            staleTime: 3 * 60 * 1000, // 3 minutes - same as conversations
          })
          .catch(() => {
            // Silently fail - we already have cached data
          });
        return cached;
      }

      // No cache, fetch and cache it
      return await getChatHistoryMutation.mutateAsync(conversationId);
    },
    [getChatHistoryMutation, queryClient]
  );

  // Fetch notification counter (unread messages + pending requests)
  const { data: notificationCounter } = useQuery({
    queryKey: queryKeys.agent.notificationCounter(),
    queryFn: async () => {
      const response = await agentApi.getNotificationCounter();
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch notification counter");
      }
      return response.total_count;
    },
    enabled: shouldLoadData,
    staleTime: 0, // Always fetch fresh (polling handles refresh)
    refetchOnMount: false,
  });

  // Sync unread counts from conversations to notification store
  useEffect(() => {
    const convs = conversationsResponse ?? [];
    for (const conv of convs) {
      if (conv.unread_count !== undefined) {
        setUnreadCount(conv.id, conv.unread_count);
      }
    }
  }, [conversationsResponse, setUnreadCount]);

  // Sync notification counter to store (includes unread messages + pending requests)
  useEffect(() => {
    // Only set if valid number >= 0, otherwise don't update (defaults to 0)
    if (
      notificationCounter !== undefined &&
      typeof notificationCounter === "number" &&
      !isNaN(notificationCounter) &&
      notificationCounter >= 0
    ) {
      setTotalUnreadCount(notificationCounter);
    }
  }, [notificationCounter, setTotalUnreadCount]);

  // Return cached conversations if available, otherwise use response
  // This ensures data shows immediately even when isLoading is true
  const conversations = useMemo(() => {
    return conversationsResponse ?? cachedConversations ?? [];
  }, [conversationsResponse, cachedConversations]);

  return {
    conversations,
    isLoading,
    error: error?.message ?? null,
    refreshChats,
    sendMessage,
    getChatHistory,
    isSendingMessage: sendMessageMutation.isPending,
    lastFetchedAt: dataUpdatedAt > 0 ? dataUpdatedAt : null,
  };
}
