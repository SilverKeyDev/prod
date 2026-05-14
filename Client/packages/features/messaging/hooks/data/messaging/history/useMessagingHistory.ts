/**
 * Encapsulates chat history loading: state, effect, and refs used by useMessaging.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { mapApiMessagesToChatMessages } from "packages/features/messaging/hooks/data/messaging/helpers";
import type { ChatMessage } from "packages/features/messaging/hooks/data/messaging/types";
import { OLDER_CHAT_HISTORY_PAGE_SIZE } from "packages/features/messaging/hooks/data/useAgentChats.constants";
import { log, LOG_CATEGORIES } from "packages/logger";

import {
  type GetChatHistoryRef,
  type HistoryEffectRefs,
  type HistoryEffectSetters,
  runHistoryEffect,
} from "./useMessagingHistory.effect";

export type UseMessagingHistoryParams = {
  activeConversationId: string;
  currentConversationLastMessageAt: number;
  getChatHistory: GetChatHistoryRef;
  markConversationRead: (conversationId: string) => void;
  updateLastReadTimestamp: (conversationId: string, timestamp: number) => void;
};

export type UseMessagingHistoryReturn = {
  localMessages: ChatMessage[];
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoadingHistory: boolean;
  hasMoreOlder: boolean;
  setHasMoreOlder: React.Dispatch<React.SetStateAction<boolean>>;
  isLoadingOlder: boolean;
  loadOlderMessages: () => Promise<void>;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
  getChatHistoryRef: React.MutableRefObject<GetChatHistoryRef>;
  lastKnownMessageTimestampRef: React.MutableRefObject<number>;
  lastMessageAtRef: React.MutableRefObject<number>;
};

export function useMessagingHistory(params: UseMessagingHistoryParams): UseMessagingHistoryReturn {
  const {
    activeConversationId,
    currentConversationLastMessageAt,
    getChatHistory,
    markConversationRead,
    updateLastReadTimestamp,
  } = params;

  const queryClient = useQueryClient();
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);

  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const getChatHistoryRef = useRef(getChatHistory);
  const lastKnownMessageTimestampRef = useRef<number>(0);
  const lastConversationIdRef = useRef<string>("");
  const lastMessageAtRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const localMessagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    getChatHistoryRef.current = getChatHistory;
  }, [getChatHistory]);

  useEffect(() => {
    localMessagesRef.current = localMessages;
  }, [localMessages]);

  useEffect(() => {
    const refs: HistoryEffectRefs = {
      loadedHistoryIdsRef,
      getChatHistoryRef,
      lastKnownMessageTimestampRef,
      lastConversationIdRef,
      lastMessageAtRef,
      isLoadingRef,
      localMessagesRef,
    };
    const setters: HistoryEffectSetters = {
      setLocalMessages,
      setIsLoadingHistory,
      setHasMoreOlder,
      markConversationRead,
      updateLastReadTimestamp,
    };
    const cleanup = runHistoryEffect(
      activeConversationId,
      currentConversationLastMessageAt,
      queryClient,
      refs,
      setters
    );
    return cleanup ?? undefined;
  }, [
    activeConversationId,
    currentConversationLastMessageAt,
    markConversationRead,
    updateLastReadTimestamp,
    queryClient,
    setHasMoreOlder,
    setLocalMessages,
    setIsLoadingHistory,
  ]);

  const loadOlderMessages = useCallback(async () => {
    if (!activeConversationId || !hasMoreOlder || isLoadingOlder) return;
    const oldest = localMessagesRef.current[0];
    if (!oldest) return;
    setIsLoadingOlder(true);
    try {
      const data = await getChatHistory(activeConversationId, {
        limit: OLDER_CHAT_HISTORY_PAGE_SIZE,
        beforeTimestamp: oldest.timestamp.toISOString(),
        beforeMessageId: oldest.id,
      });
      const older = mapApiMessagesToChatMessages(data.messages ?? []);
      setLocalMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const prepended = older.filter((m) => !ids.has(m.id));
        if (prepended.length === 0) {
          return prev;
        }
        return [...prepended, ...prev];
      });
      setHasMoreOlder(data.has_more_older ?? false);
    } catch (err) {
      log.warn(LOG_CATEGORIES.MESSAGES, "loadOlderMessages failed", err);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeConversationId, getChatHistory, hasMoreOlder, isLoadingOlder]);

  return {
    localMessages,
    setLocalMessages,
    isLoadingHistory,
    hasMoreOlder,
    setHasMoreOlder,
    isLoadingOlder,
    loadOlderMessages,
    loadedHistoryIdsRef,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastMessageAtRef,
  };
}
