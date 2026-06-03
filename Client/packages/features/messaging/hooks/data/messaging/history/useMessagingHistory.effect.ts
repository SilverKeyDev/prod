/**
 * History load effect logic for useMessagingHistory (keeps hook under max-lines-per-function).
 */

import type { QueryClient } from "@tanstack/react-query";

import { agentApi } from "packages/api";
import { queryKeys } from "packages/config/query/keys";
import { mapApiMessagesToChatMessages } from "packages/features/messaging/hooks/data/messaging/helpers";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import {
  INITIAL_CHAT_HISTORY_LIMIT,
  SYNC_NEWER_CHAT_LIMIT,
} from "packages/features/messaging/hooks/data/useAgentChats.constants";
import type {
  AgentChatHistoryCacheEntry,
  GetAgentChatHistoryOptions,
} from "packages/features/messaging/hooks/data/useAgentChats.types";
import { log } from "packages/logger";

export type GetChatHistoryRef = (
  conversationId: string,
  options?: GetAgentChatHistoryOptions
) => Promise<AgentChatHistoryCacheEntry>;

export type HistoryEffectRefs = {
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
  getChatHistoryRef: React.MutableRefObject<GetChatHistoryRef>;
  lastKnownMessageTimestampRef: React.MutableRefObject<number>;
  lastConversationIdRef: React.MutableRefObject<string>;
  lastMessageAtRef: React.MutableRefObject<number>;
  isLoadingRef: React.MutableRefObject<boolean>;
  localMessagesRef: React.MutableRefObject<ChatMessage[]>;
};

export type HistoryEffectSetters = {
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsLoadingHistory: (v: boolean) => void;
  setHasMoreOlder: (v: boolean) => void;
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
    log.error("MESSAGES", "Failed to mark messages as read", err);
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
  const {
    setLocalMessages,
    setIsLoadingHistory,
    setHasMoreOlder,
    markConversationRead,
    updateLastReadTimestamp,
  } = setters;
  const {
    loadedHistoryIdsRef,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastConversationIdRef,
    lastMessageAtRef,
    isLoadingRef,
    localMessagesRef,
  } = refs;

  if (!activeConversationId) {
    setLocalMessages([]);
    setHasMoreOlder(false);
    lastKnownMessageTimestampRef.current = 0;
    lastConversationIdRef.current = "";
    lastMessageAtRef.current = 0;
    isLoadingRef.current = false;
    return;
  }
  if (isLoadingRef.current) return;

  const cachedHistory = queryClient.getQueryData<AgentChatHistoryCacheEntry>(
    queryKeys.agent.history(activeConversationId)
  );

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

  const syncNewerOnly =
    !conversationChanged &&
    loadedHistoryIdsRef.current.has(activeConversationId) &&
    messageTimestampChanged &&
    hasNewMessages;

  if (syncNewerOnly) {
    void (async () => {
      const msgs = localMessagesRef.current;
      if (msgs.length === 0) {
        lastKnownMessageTimestampRef.current = currentLastMessageAt;
        lastMessageAtRef.current = currentLastMessageAt;
        return;
      }
      const latest = msgs[msgs.length - 1];
      try {
        const data = await getChatHistoryRef.current(activeConversationId, {
          afterTimestamp: latest.timestamp.toISOString(),
          afterMessageId: latest.id,
          limit: SYNC_NEWER_CHAT_LIMIT,
        });
        if (lastConversationIdRef.current !== activeConversationId) return;
        const incoming = mapApiMessagesToChatMessages(data.messages ?? []);
        const ids = new Set(msgs.map((m) => m.id));
        const toAdd = incoming.filter((m) => !ids.has(m.id));
        if (toAdd.length === 0) {
          lastKnownMessageTimestampRef.current = currentLastMessageAt;
          lastMessageAtRef.current = currentLastMessageAt;
          return;
        }
        const merged = [...msgs, ...toAdd];
        setLocalMessages(merged);
        markReadAndUpdateTimestamp(
          activeConversationId,
          merged,
          markConversationRead,
          updateLastReadTimestamp
        );
        lastKnownMessageTimestampRef.current = currentLastMessageAt;
        lastMessageAtRef.current = currentLastMessageAt;
      } catch {
        // Cursor / network errors: leave local state; user can refresh
      }
    })();
    return;
  }

  if (cachedHistory && isInitialLoad) {
    const cachedMessages = mapApiMessagesToChatMessages(cachedHistory.messages ?? []);
    setLocalMessages(cachedMessages);
    setHasMoreOlder(cachedHistory.has_more_older ?? false);
    loadedHistoryIdsRef.current.add(activeConversationId);
    if (cachedMessages.length > 0) {
      const latest = cachedMessages[cachedMessages.length - 1];
      const latestTs = latest.timestamp.getTime();
      lastKnownMessageTimestampRef.current = latestTs;
      lastMessageAtRef.current =
        currentLastMessageAt > 0 ? Math.max(currentLastMessageAt, latestTs) : latestTs;
    } else if (currentLastMessageAt > 0) {
      lastKnownMessageTimestampRef.current = currentLastMessageAt;
      lastMessageAtRef.current = currentLastMessageAt;
    }
    markReadAndUpdateTimestamp(
      activeConversationId,
      cachedMessages,
      markConversationRead,
      updateLastReadTimestamp
    );
    lastConversationIdRef.current = activeConversationId;
    void queryClient
      .fetchQuery({
        queryKey: queryKeys.agent.history(activeConversationId),
        queryFn: () =>
          getChatHistoryRef.current(activeConversationId, {
            limit: INITIAL_CHAT_HISTORY_LIMIT,
          }),
        staleTime: 3 * 60 * 1000,
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
  queryClient.removeQueries({
    queryKey: queryKeys.agent.history(activeConversationId),
  });
  isLoadingRef.current = true;

  let cancelled = false;
  const loadHistory = async () => {
    if (isInitialLoad && !cachedHistory) setIsLoadingHistory(true);
    try {
      const data = await getChatHistoryRef.current(activeConversationId, {
        limit: INITIAL_CHAT_HISTORY_LIMIT,
      });
      if (!cancelled) {
        loadedHistoryIdsRef.current.add(activeConversationId);
        const messages = mapApiMessagesToChatMessages(data.messages ?? []);
        setLocalMessages(messages);
        setHasMoreOlder(data.has_more_older ?? false);
        if (messages.length > 0) {
          const latest = messages[messages.length - 1];
          lastKnownMessageTimestampRef.current = latest.timestamp.getTime();
        }
        if (currentLastMessageAt > 0) {
          lastMessageAtRef.current = currentLastMessageAt;
          lastKnownMessageTimestampRef.current = Math.max(
            lastKnownMessageTimestampRef.current,
            currentLastMessageAt
          );
        } else if (messages.length > 0) {
          const latest = messages[messages.length - 1];
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
      // Error surfaced by toast in getChatHistory (tail fetch)
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
