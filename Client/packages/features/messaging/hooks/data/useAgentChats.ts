import { useCallback, useEffect, useMemo, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { AgentChatMessage, AgentConversation } from "packages/api";
import { agentApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { isSameMessagingUserId } from "packages/features/messaging/utils/userIdMatch";
import { showErrorToast } from "packages/hooks/ui/toast";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import { useNotificationStore } from "packages/store";

export const INITIAL_CHAT_HISTORY_LIMIT = 5;
export const OLDER_CHAT_HISTORY_PAGE_SIZE = 10;
export const SYNC_NEWER_CHAT_LIMIT = 50;

export type AgentChatHistoryCacheEntry = {
  messages: AgentChatMessage[];
  conversation?: AgentConversation;
  has_more_older?: boolean;
  has_more_newer?: boolean;
};

export type GetAgentChatHistoryOptions = {
  limit?: number;
  beforeTimestamp?: string;
  beforeMessageId?: string;
  afterTimestamp?: string;
  afterMessageId?: string;
};

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
  getChatHistory: (
    conversationId: string,
    options?: GetAgentChatHistoryOptions
  ) => Promise<AgentChatHistoryCacheEntry>;
  isSendingMessage: boolean;
  lastFetchedAt: number | null;
};

export type UseAgentChatsOptions = {
  /**
   * When false, skips queries and side-effect syncs so a parent can own the live subscription
   * (see `useMessaging` agent path with `agentChats`).
   */
  fetchEnabled?: boolean;
};

/**
 * Hook to manage agent conversations
 * Works for both agents and clients
 */
export function useAgentChats(
  clientId?: string,
  options?: UseAgentChatsOptions
): UseAgentChatsReturn {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const setTotalUnreadCount = useNotificationStore((s) => s.setTotalUnreadCount);
  const lastConvUnreadSyncRef = useRef<string>("");
  const instanceIdRef = useRef(`uac-${Math.random().toString(36).slice(2, 9)}`);
  const lastConversationLogFingerprintRef = useRef("");

  const fetchEnabled = options?.fetchEnabled !== false;

  // Check cache first when enabled becomes true (cache-first strategy)
  const shouldLoadData = useMemo(() => authReady && isAuthenticated, [authReady, isAuthenticated]);
  const loadData = useMemo(() => shouldLoadData && fetchEnabled, [shouldLoadData, fetchEnabled]);

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
    if (!loadData) return undefined;
    // Check cache using the same query key
    const cached = queryClient.getQueryData<AgentConversation[]>(queryKey);
    if (cached) {
      // If clientId is provided, filter to that client's conversation
      if (clientId) {
        return cached.filter((conv) => isSameMessagingUserId(conv.client_id, clientId));
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
        return clientId
          ? cachedAll.filter((conv) => isSameMessagingUserId(conv.client_id, clientId))
          : cachedAll;
      }
    }
    return undefined;
  }, [loadData, queryClient, queryKey, clientId]);

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
    enabled: loadData,
    // Use placeholderData to show cached data immediately
    placeholderData: (previousValue) => {
      // Return cached data if available, otherwise previous value
      return cachedConversations ?? previousValue;
    },
    staleTime: 30 * 1000, // 30 seconds - conversations change frequently
    // Default refetchOnMount: refetch when stale so tab switches use cache within staleTime.
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    log.debug(LOG_CATEGORIES.MESSAGES, "useAgentChats: observer", {
      instanceId: instanceIdRef.current,
      fetchEnabled,
      clientId: clientId ?? null,
    });
    // Log subscription identity once per mount (StrictMode may double in dev).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, []);

  useEffect(() => {
    if (!loadData) {
      if (!shouldLoadData) {
        log.info(LOG_CATEGORIES.MESSAGES, "useAgentChats: query disabled until auth ready", {
          authReady,
          isAuthenticated,
          instanceId: instanceIdRef.current,
        });
      }
      return;
    }
    if (error) {
      log.warn(LOG_CATEGORIES.MESSAGES, "useAgentChats: fetch failed", {
        message: error instanceof Error ? error.message : String(error),
        clientIdFilter: clientId ?? null,
        instanceId: instanceIdRef.current,
      });
      return;
    }
    if (isLoading && conversationsResponse === undefined) {
      log.debug(LOG_CATEGORIES.MESSAGES, "useAgentChats: loading", {
        clientIdFilter: clientId ?? null,
        instanceId: instanceIdRef.current,
      });
      return;
    }
    const ids = (conversationsResponse ?? []).map((c) => c.id).sort();
    const fingerprint = [
      conversationsResponse?.length ?? 0,
      clientId ?? "",
      isLoading ? "1" : "0",
      error instanceof Error ? error.message : error ? String(error) : "",
      ids.join(","),
    ].join("|");
    if (fingerprint === lastConversationLogFingerprintRef.current) return;
    lastConversationLogFingerprintRef.current = fingerprint;
    log.info(LOG_CATEGORIES.MESSAGES, "useAgentChats: conversations result", {
      count: conversationsResponse?.length ?? 0,
      clientIdFilter: clientId ?? null,
      ids,
      instanceId: instanceIdRef.current,
    });
  }, [
    loadData,
    shouldLoadData,
    authReady,
    isAuthenticated,
    isLoading,
    conversationsResponse,
    error,
    clientId,
  ]);

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
    onSuccess: (_data, _variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.conversations(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.agent.all,
      });
    },
    onError: (error) => {
      log.error(LOG_CATEGORIES.ERRORS, "Send message failed", error);
      showErrorToast("Failed to send message. Please try again.");
    },
  });

  const fetchTailHistory = useCallback(
    async (conversationId: string, limit: number): Promise<AgentChatHistoryCacheEntry> => {
      const response = await agentApi.getChatHistory(conversationId, { limit });
      if (!response.success) {
        throw new Error(response.error ?? "Failed to fetch chat history");
      }
      return {
        messages: response.messages ?? [],
        conversation: response.conversation,
        has_more_older: response.has_more_older,
        has_more_newer: response.has_more_newer,
      };
    },
    []
  );

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
    async (
      conversationId: string,
      options?: GetAgentChatHistoryOptions
    ): Promise<AgentChatHistoryCacheEntry> => {
      const hasCursor = !!(options?.beforeTimestamp || options?.afterTimestamp);

      if (hasCursor) {
        const response = await agentApi.getChatHistory(conversationId, {
          limit: options?.limit,
          before_timestamp: options?.beforeTimestamp,
          before_message_id: options?.beforeMessageId,
          after_timestamp: options?.afterTimestamp,
          after_message_id: options?.afterMessageId,
        });
        if (!response.success) {
          throw new Error(response.error ?? "Failed to fetch chat history");
        }
        return {
          messages: response.messages ?? [],
          conversation: response.conversation,
          has_more_older: response.has_more_older,
          has_more_newer: response.has_more_newer,
        };
      }

      const tailLimit = options?.limit ?? INITIAL_CHAT_HISTORY_LIMIT;
      const historyKey = queryKeys.agent.history(conversationId);
      const cached = queryClient.getQueryData<AgentChatHistoryCacheEntry>(historyKey);

      if (cached) {
        void queryClient
          .fetchQuery({
            queryKey: historyKey,
            queryFn: () => fetchTailHistory(conversationId, tailLimit),
            staleTime: 3 * 60 * 1000,
          })
          .catch(() => {});
        return cached;
      }

      try {
        const result = await fetchTailHistory(conversationId, tailLimit);
        queryClient.setQueryData(historyKey, result);
        return result;
      } catch (error) {
        log.error(LOG_CATEGORIES.ERRORS, "Get chat history failed", {
          error,
          conversationId,
        });
        showErrorToast("Failed to load messages. Please try again.");
        throw error;
      }
    },
    [fetchTailHistory, queryClient]
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
    enabled: loadData,
    staleTime: 0, // Always fetch fresh (polling handles refresh)
    refetchOnMount: false,
  });

  // Sync unread counts from conversations to notification store.
  //
  // We compute a fingerprint of (id, count) pairs first and bail out when it
  // matches the last sync. Without this guard, every refetch (every 8s on
  // /messaging) called `setUnreadCount` N times, and even when each call was
  // idempotent the per-instance work added up. With this guard the entire
  // effect short-circuits when nothing actually changed.
  useEffect(() => {
    if (!loadData) return;
    const convs = conversationsResponse ?? [];
    let signature = "";
    for (const conv of convs) {
      if (conv.unread_count !== undefined) {
        signature += `${conv.id}:${conv.unread_count}|`;
      }
    }
    if (signature === lastConvUnreadSyncRef.current) return;
    lastConvUnreadSyncRef.current = signature;
    for (const conv of convs) {
      if (conv.unread_count !== undefined) {
        setUnreadCount(conv.id, conv.unread_count);
      }
    }
  }, [loadData, conversationsResponse, setUnreadCount]);

  // Sync notification counter to store (includes unread messages + pending requests)
  useEffect(() => {
    if (!loadData) return;
    // Only set if valid number >= 0, otherwise don't update (defaults to 0)
    if (
      notificationCounter !== undefined &&
      typeof notificationCounter === "number" &&
      !isNaN(notificationCounter) &&
      notificationCounter >= 0
    ) {
      setTotalUnreadCount(notificationCounter);
    }
  }, [loadData, notificationCounter, setTotalUnreadCount]);

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
