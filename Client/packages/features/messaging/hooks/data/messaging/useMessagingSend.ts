/**
 * Send and retry message logic for useMessaging. Extracted to keep main hook under max-lines-per-function.
 */

import { useCallback } from "react";

import type { ChatMessage, UseMessagingConfig } from "./types";
import {
  executeRetryMessage,
  executeSendMessage,
  resolveConversationIdForSend,
} from "./useMessaging.sendHelpers";

export type UseMessagingSendParams = {
  config: UseMessagingConfig;
  activeConversationId: string;
  localMessages: ChatMessage[];
  sendMessageApi: (
    conversationId: string,
    message: string,
    clientId?: string,
    sharedHomeId?: string,
    sharedDocumentId?: string
  ) => Promise<void>;
  refreshChats: () => Promise<void>;
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getChatHistoryRef: React.MutableRefObject<
    (conversationId: string) => Promise<{ messages: unknown[] }>
  >;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
};

export type UseMessagingSendReturn = {
  sendMessage: (messageText: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
};

export function useMessagingSend(params: UseMessagingSendParams): UseMessagingSendReturn {
  const {
    config,
    activeConversationId,
    localMessages,
    sendMessageApi,
    refreshChats,
    setLocalMessages,
    getChatHistoryRef,
    loadedHistoryIdsRef,
  } = params;
  const { mode, agentId, clientIdForSending } = config;
  const clientId = clientIdForSending ?? undefined;
  const messageRole: "user" | "agent" = mode === "client" ? "user" : "agent";

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      await executeSendMessage({
        userMessage: messageText.trim(),
        conversationId,
        mode,
        clientIdForSending: clientId,
        messageRole,
        sendMessageApi,
        refreshChats,
        setLocalMessages,
        getChatHistoryRef,
        loadedHistoryIdsRef,
      });
    },
    [
      activeConversationId,
      mode,
      agentId,
      clientIdForSending,
      sendMessageApi,
      refreshChats,
      setLocalMessages,
      getChatHistoryRef,
      loadedHistoryIdsRef,
      clientId,
      messageRole,
    ]
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const failedMessage = localMessages.find(
        (msg) => msg.id === messageId && msg.status === "failed"
      );
      if (!failedMessage) return;
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      await executeRetryMessage({
        messageId,
        conversationId,
        mode,
        clientIdForSending: clientId,
        content: failedMessage.content,
        sendMessageApi,
        refreshChats,
        setLocalMessages,
        getChatHistoryRef,
        loadedHistoryIdsRef,
      });
    },
    [
      localMessages,
      activeConversationId,
      mode,
      agentId,
      clientIdForSending,
      sendMessageApi,
      refreshChats,
      setLocalMessages,
      getChatHistoryRef,
      loadedHistoryIdsRef,
      clientId,
    ]
  );

  return { sendMessage, retryMessage };
}
