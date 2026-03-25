/**
 * Shared hook for messaging (client and agent). Composes useMessagingHistory with send/retry/format.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { useAgentChats } from "packages/hooks/data/chat/useAgentChats";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNotificationStore } from "packages/store";
import { dateParseISO } from "packages/utils/date";

import { formatMessageTime, mapApiMessagesToChatMessages } from "./helpers";
import type { UseMessagingConfig, UseMessagingReturn } from "./types";
import { useMessagingHistory } from "./useMessagingHistory";
import { useMessagingSend } from "./useMessagingSend";

export function useMessaging(config: UseMessagingConfig): UseMessagingReturn {
  const { mode, conversationSelector, clientIdForSending, agentId } = config;
  const queryClient = useQueryClient();

  const {
    conversations,
    sendMessage: sendMessageApi,
    getChatHistory,
    refreshChats,
  } = useAgentChats(mode === "agent" ? (conversationSelector ?? undefined) : undefined);

  const markConversationRead = useNotificationStore((s) => s.markConversationRead);
  const updateLastReadTimestamp = useNotificationStore((s) => s.updateLastReadTimestamp);
  const setActiveConversationIdInStore = useNotificationStore((s) => s.setActiveConversationId);

  const [activeConversationId, setActiveConversationIdState] = useState<string>("");

  const activeConversation = useMemo(() => {
    if (!conversationSelector || conversations.length === 0) return null;
    return conversations.find((c) => c.client_id === conversationSelector) ?? null;
  }, [conversations, conversationSelector]);

  const currentConversationLastMessageAt = useMemo(() => {
    if (!activeConversationId) return 0;
    const conv = conversations.find((c) => c.id === activeConversationId);
    return conv?.last_message_at ? dateParseISO(conv.last_message_at).valueOf() : 0;
  }, [activeConversationId, conversations]);

  const history = useMessagingHistory({
    activeConversationId,
    currentConversationLastMessageAt,
    getChatHistory,
    markConversationRead,
    updateLastReadTimestamp,
  });

  const {
    localMessages,
    setLocalMessages,
    isLoadingHistory,
    loadedHistoryIdsRef,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastMessageAtRef,
  } = history;

  const { sendMessage, sendSharedHome, sendSharedDocument, retryMessage } = useMessagingSend({
    config: { mode, conversationSelector, clientIdForSending, agentId },
    activeConversationId,
    localMessages,
    sendMessageApi,
    refreshChats,
    setLocalMessages,
    getChatHistoryRef,
    loadedHistoryIdsRef,
  });

  useEffect(() => {
    const newId = activeConversation?.id ?? "";
    if (activeConversationId !== newId) {
      setActiveConversationIdState(newId);
      setActiveConversationIdInStore(newId || null);
    }
  }, [activeConversation?.id, activeConversationId, setActiveConversationIdInStore]);

  const setActiveConversationId = useCallback(
    (id: string) => {
      setActiveConversationIdState(id);
      setActiveConversationIdInStore(id || null);
    },
    [setActiveConversationIdInStore]
  );

  const formatTime = useCallback((date: Date) => formatMessageTime(date), []);

  const canSendMessage = useMemo(() => {
    if (mode === "client") {
      return !!(activeConversationId || agentId);
    }
    return !!clientIdForSending;
  }, [mode, activeConversationId, agentId, clientIdForSending]);

  const refreshActiveConversationHistory = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      queryClient.removeQueries({
        queryKey: queryKeys.agent.history(activeConversationId),
      });
      const data = await getChatHistoryRef.current(activeConversationId);
      const messages = mapApiMessagesToChatMessages(data.messages ?? []);
      setLocalMessages(messages);
      if (messages.length > 0) {
        const last = messages[messages.length - 1];
        lastKnownMessageTimestampRef.current = last.timestamp.getTime();
        lastMessageAtRef.current = last.timestamp.getTime();
      }
    } catch (err) {
      log.error(LOG_CATEGORIES.API, "Refresh conversation history failed", err);
    }
  }, [
    activeConversationId,
    setLocalMessages,
    queryClient,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastMessageAtRef,
  ]);

  return {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    activeConversation,
    conversations,
    sendMessage,
    sendSharedHome,
    sendSharedDocument,
    retryMessage,
    setActiveConversationId,
    refreshActiveConversationHistory,
    refreshChats,
    formatTime,
    canSendMessage,
  };
}
