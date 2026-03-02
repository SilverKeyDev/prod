/**
 * History load effect logic for useMessagingHistory (keeps hook under max-lines-per-function).
 */

import type { QueryClient } from "@tanstack/react-query";

import type { AgentChatMessage, AgentConversation } from "packages/api";
import { agentApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";

import { mapApiMessagesToChatMessages } from "./helpers";
import type { ChatMessage } from "./types";

export type HistoryEffectRefs = {
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
  getChatHistoryRef: React.MutableRefObject<
    (conversationId: string) => Promise<{
      messages: AgentChatMessage[];
      conversation?: AgentConversation;
    }>
  >;
  lastKnownMessageTimestampRef: React.MutableRefObject<number>;
  lastConversationIdRef: React.MutableRefObject<string>;
  lastMessageAtRef: React.MutableRefObject<number>;
  isLoadingRef: React.MutableRefObject<boolean>;
};

export type HistoryEffectSetters = {
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoadingHistory: (v: boolean) => void;
  markConversationRead: (conversationId: string) => void;
  updateLastReadTimestamp: (conversationId: string, timestamp: number) => void;
};

function markReadAndUpdateTimestamp(
  conversationId: string,
  messages: ChatMessage[],
  markConversationRead: (id: string) => void,
  updateLastReadTimestamp: (id: string, ts: number) => void
): void {
  markConversationRead(conversationId);
  void agentApi.markMessagesAsRead(conversationId).catch((err) => {
    log.error(LOG_CATEGORIES.MESSAGES, "Failed to mark messages as read", err);
  });
  if (messages.length > 0) {
    const latest = messages[messages.length - 1];
    updateLastReadTimestamp(conversationId, latest.timestamp.getTime());
  }
}

export function runHistoryEffect(
  activeConversationId: string,
  currentConversationLastMessageAt: number,
  queryClient: QueryClient,
  refs: HistoryEffectRefs,
  setters: HistoryEffectSetters
): (() => void) | void {
  const { setLocalMessages, setIsLoadingHistory, markConversationRead, updateLastReadTimestamp } =
    setters;
  const {
    loadedHistoryIdsRef,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastConversationIdRef,
    lastMessageAtRef,
    isLoadingRef,
  } = refs;

  if (!activeConversationId) {
    setLocalMessages([]);
    lastKnownMessageTimestampRef.current = 0;
    lastConversationIdRef.current = "";
    lastMessageAtRef.current = 0;
    isLoadingRef.current = false;
    return;
  }
  if (isLoadingRef.current) return;

  const cachedHistory = queryClient.getQueryData<{
    messages: AgentChatMessage[];
    conversation?: AgentConversation;
  }>(queryKeys.agent.history(activeConversationId));

  const currentLastMessageAt = currentConversationLastMessageAt;
  const conversationChanged = lastConversationIdRef.current !== activeConversationId;
  const hasNewMessages = currentLastMessageAt > lastKnownMessageTimestampRef.current;
  const messageTimestampChanged = currentLastMessageAt !== lastMessageAtRef.current;
  const isInitialLoad =
    conversationChanged || !loadedHistoryIdsRef.current.has(activeConversationId);
  const shouldReload =
    conversationChanged ||
    !loadedHistoryIdsRef.current.has(activeConversationId) ||
    (messageTimestampChanged && hasNewMessages);

  if (cachedHistory && isInitialLoad) {
    const cachedMessages = mapApiMessagesToChatMessages(cachedHistory.messages ?? []);
    setLocalMessages(cachedMessages);
    loadedHistoryIdsRef.current.add(activeConversationId);
    if (cachedMessages.length > 0) {
      const latest = cachedMessages[cachedMessages.length - 1];
      lastKnownMessageTimestampRef.current = latest.timestamp.getTime();
      lastMessageAtRef.current = latest.timestamp.getTime();
    }
    markReadAndUpdateTimestamp(
      activeConversationId,
      cachedMessages,
      markConversationRead,
      updateLastReadTimestamp
    );
    lastConversationIdRef.current = activeConversationId;
    void getChatHistoryRef
      .current(activeConversationId)
      .then((data) => {
        if (lastConversationIdRef.current === activeConversationId) {
          const messages = mapApiMessagesToChatMessages(data.messages ?? []);
          setLocalMessages(messages);
          if (messages.length > 0) {
            const latest = messages[messages.length - 1];
            lastKnownMessageTimestampRef.current = latest.timestamp.getTime();
            lastMessageAtRef.current = latest.timestamp.getTime();
          }
        }
      })
      .catch(() => {});
    return;
  }

  if (!shouldReload) {
    markReadAndUpdateTimestamp(
      activeConversationId,
      [],
      markConversationRead,
      updateLastReadTimestamp
    );
    return;
  }

  lastConversationIdRef.current = activeConversationId;
  if (currentLastMessageAt > 0) {
    lastMessageAtRef.current = currentLastMessageAt;
    lastKnownMessageTimestampRef.current = currentLastMessageAt;
  }
  queryClient.removeQueries({
    queryKey: queryKeys.agent.history(activeConversationId),
  });
  isLoadingRef.current = true;

  let cancelled = false;
  const loadHistory = async () => {
    if (isInitialLoad && !cachedHistory) setIsLoadingHistory(true);
    try {
      const data = await getChatHistoryRef.current(activeConversationId);
      if (!cancelled) {
        loadedHistoryIdsRef.current.add(activeConversationId);
        const messages = mapApiMessagesToChatMessages(data.messages ?? []);
        setLocalMessages(messages);
        if (messages.length > 0) {
          const latest = messages[messages.length - 1];
          lastKnownMessageTimestampRef.current = latest.timestamp.getTime();
          lastMessageAtRef.current = latest.timestamp.getTime();
        }
        markReadAndUpdateTimestamp(
          activeConversationId,
          messages,
          markConversationRead,
          updateLastReadTimestamp
        );
      }
    } catch {
      // Error handled by query
    } finally {
      if (!cancelled) {
        if (isInitialLoad && !cachedHistory) setIsLoadingHistory(false);
        isLoadingRef.current = false;
      }
    }
  };
  void loadHistory();
  return () => {
    cancelled = true;
    isLoadingRef.current = false;
  };
}
