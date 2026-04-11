/**
 * Shared hook for messaging (client and agent). Composes useMessagingHistory with send/retry/format.
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import type { AgentConversation } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { useAgentChats } from "packages/features/messaging/hooks/data/useAgentChats";
import { isSameMessagingUserId } from "packages/features/messaging/utils/userIdMatch";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useNotificationStore } from "packages/store";
import { dateParseISO } from "packages/utils/date";

import { formatMessageTime, mapApiMessagesToChatMessages } from "./helpers";
import type { UseMessagingConfig, UseMessagingReturn } from "./types";
import { useMessagingHistory } from "./useMessagingHistory";
import { useMessagingSend } from "./useMessagingSend";

function compareConversationsByRecency(
  a: AgentConversation,
  b: AgentConversation,
): number {
  const taRaw = a.last_message_at ?? a.updated_at;
  const tbRaw = b.last_message_at ?? b.updated_at;
  if (!taRaw && !tbRaw) return 0;
  if (!taRaw) return 1;
  if (!tbRaw) return -1;
  return dateParseISO(tbRaw).valueOf() - dateParseISO(taRaw).valueOf();
}

export function useMessaging(config: UseMessagingConfig): UseMessagingReturn {
  const { mode, conversationSelector, clientIdForSending, agentId } = config;
  const queryClient = useQueryClient();

  const {
    conversations,
    isLoading: isChatsLoading,
    sendMessage: sendMessageApi,
    getChatHistory,
    refreshChats,
  } = useAgentChats(
    mode === "agent" ? conversationSelector ?? undefined : undefined,
  );

  const markConversationRead = useNotificationStore(
    (s) => s.markConversationRead,
  );
  const updateLastReadTimestamp = useNotificationStore(
    (s) => s.updateLastReadTimestamp,
  );
  const setActiveConversationIdInStore = useNotificationStore(
    (s) => s.setActiveConversationId,
  );

  const [activeConversationId, setActiveConversationIdState] =
    useState<string>("");

  const activeConversation = useMemo(() => {
    if (conversations.length === 0) return null;
    if (mode === "agent") {
      if (!conversationSelector) return null;
      return (
        conversations.find((c) =>
          isSameMessagingUserId(c.client_id, conversationSelector),
        ) ?? null
      );
    }
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  }, [mode, conversations, conversationSelector, activeConversationId]);

  const currentConversationLastMessageAt = useMemo(() => {
    if (!activeConversationId) return 0;
    const conv = conversations.find((c) => c.id === activeConversationId);
    return conv?.last_message_at
      ? dateParseISO(conv.last_message_at).valueOf()
      : 0;
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

  const { sendMessage, sendSharedHome, sendSharedDocument, retryMessage } =
    useMessagingSend({
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
    if (mode !== "agent") return;
    const newId = activeConversation?.id ?? "";
    if (activeConversationId !== newId) {
      setActiveConversationIdState(newId);
      setActiveConversationIdInStore(newId || null);
    }
  }, [
    mode,
    activeConversation?.id,
    activeConversationId,
    setActiveConversationIdInStore,
  ]);

  useEffect(() => {
    if (mode !== "client") return;
    const filtered =
      conversationSelector != null && conversationSelector !== ""
        ? conversations.filter((c) =>
            isSameMessagingUserId(c.client_id, conversationSelector),
          )
        : [];
    const pool = filtered.length > 0 ? filtered : conversations;
    const mine = [...pool].sort(compareConversationsByRecency);
    if (mine.length === 0) {
      if (activeConversationId !== "") {
        setActiveConversationIdState("");
        setActiveConversationIdInStore(null);
      }
      return;
    }
    const stillValid = mine.some((c) => c.id === activeConversationId);
    if (!activeConversationId || !stillValid) {
      const nextId = mine[0]?.id ?? "";
      if (nextId !== activeConversationId) {
        setActiveConversationIdState(nextId);
        setActiveConversationIdInStore(nextId || null);
      }
    }
  }, [
    mode,
    conversationSelector,
    conversations,
    activeConversationId,
    setActiveConversationIdInStore,
  ]);

  const setActiveConversationId = useCallback(
    (id: string) => {
      setActiveConversationIdState(id);
      setActiveConversationIdInStore(id || null);
    },
    [setActiveConversationIdInStore],
  );

  const formatTime = useCallback((date: Date) => formatMessageTime(date), []);

  const canSendMessage = useMemo(() => {
    if (mode === "client") {
      const hasAnyConversation = conversations.length > 0;
      return !!(activeConversationId || agentId || hasAnyConversation);
    }
    return !!clientIdForSending;
  }, [
    mode,
    activeConversationId,
    agentId,
    clientIdForSending,
    conversations.length,
  ]);

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
    isChatsLoading,
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
