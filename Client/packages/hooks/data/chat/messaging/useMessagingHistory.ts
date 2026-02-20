/**
 * Encapsulates chat history loading: state, effect, and refs used by useMessaging.
 */

import { useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import type { AgentChatMessage, AgentConversation } from "packages/config/api";

import type { ChatMessage } from "./types";
import {
  type HistoryEffectRefs,
  type HistoryEffectSetters,
  runHistoryEffect,
} from "./useMessagingHistory.effect";

export type UseMessagingHistoryParams = {
  activeConversationId: string;
  currentConversationLastMessageAt: number;
  getChatHistory: (conversationId: string) => Promise<{
    messages: AgentChatMessage[];
    conversation?: AgentConversation;
  }>;
  markConversationRead: (conversationId: string) => void;
  updateLastReadTimestamp: (conversationId: string, timestamp: number) => void;
};

export type UseMessagingHistoryReturn = {
  localMessages: ChatMessage[];
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoadingHistory: boolean;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
  getChatHistoryRef: React.MutableRefObject<
    (conversationId: string) => Promise<{
      messages: AgentChatMessage[];
      conversation?: AgentConversation;
    }>
  >;
  lastKnownMessageTimestampRef: React.MutableRefObject<number>;
  lastMessageAtRef: React.MutableRefObject<number>;
};

export function useMessagingHistory(
  params: UseMessagingHistoryParams,
): UseMessagingHistoryReturn {
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

  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const getChatHistoryRef = useRef(getChatHistory);
  const lastKnownMessageTimestampRef = useRef<number>(0);
  const lastConversationIdRef = useRef<string>("");
  const lastMessageAtRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  useEffect(() => {
    getChatHistoryRef.current = getChatHistory;
  }, [getChatHistory]);

  useEffect(() => {
    const refs: HistoryEffectRefs = {
      loadedHistoryIdsRef,
      getChatHistoryRef,
      lastKnownMessageTimestampRef,
      lastConversationIdRef,
      lastMessageAtRef,
      isLoadingRef,
    };
    const setters: HistoryEffectSetters = {
      setLocalMessages,
      setIsLoadingHistory,
      markConversationRead,
      updateLastReadTimestamp,
    };
    const cleanup = runHistoryEffect(
      activeConversationId,
      currentConversationLastMessageAt,
      queryClient,
      refs,
      setters,
    );
    return cleanup ?? undefined;
  }, [
    activeConversationId,
    currentConversationLastMessageAt,
    markConversationRead,
    updateLastReadTimestamp,
    queryClient,
    loadedHistoryIdsRef,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastConversationIdRef,
    lastMessageAtRef,
    isLoadingRef,
    setLocalMessages,
    setIsLoadingHistory,
  ]);

  return {
    localMessages,
    setLocalMessages,
    isLoadingHistory,
    loadedHistoryIdsRef,
    getChatHistoryRef,
    lastKnownMessageTimestampRef,
    lastMessageAtRef,
  };
}
