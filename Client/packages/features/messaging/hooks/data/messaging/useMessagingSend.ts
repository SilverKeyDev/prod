/**
 * Send and retry message logic for useMessaging. Extracted to keep main hook under max-lines-per-function.
 */

import { useCallback } from "react";

import {
  buildSharedDocumentAttachmentMessage,
  buildSharedHomeAttachmentMessage,
} from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import type { SavedHome } from "packages/types/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";

import type {
  ChatMessage,
  MessagingSendMessageOptions,
  UseMessagingConfig,
} from "./types";
import {
  executeRetryMessage,
  executeSendMessage,
  executeSendSharedAttachment,
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
    sharedDocumentId?: string,
  ) => Promise<void>;
  refreshChats: () => Promise<void>;
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getChatHistoryRef: React.MutableRefObject<
    (conversationId: string) => Promise<{ messages: unknown[] }>
  >;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
};

export type UseMessagingSendReturn = {
  sendMessage: (
    messageText: string,
    options?: MessagingSendMessageOptions,
  ) => Promise<void>;
  sendSharedHome: (home: SavedHome) => Promise<void>;
  sendSharedDocument: (document: DocumentData) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
};

export function useMessagingSend(
  params: UseMessagingSendParams,
): UseMessagingSendReturn {
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
    async (messageText: string, options?: MessagingSendMessageOptions) => {
      if (!messageText.trim()) return;
      const conversationId =
        options?.conversationId ??
        resolveConversationIdForSend({
          mode,
          activeConversationId,
          agentId,
          clientIdForSending,
        });
      if (conversationId === null) return;
      const effectiveClientId =
        mode === "agent" ? options?.clientIdForAgent ?? clientId : undefined;
      await executeSendMessage({
        userMessage: messageText.trim(),
        conversationId,
        mode,
        clientIdForSending: effectiveClientId,
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
    ],
  );

  const sendSharedHome = useCallback(
    async (home: SavedHome) => {
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      const propertyId = home.home_id || home.address || "";
      if (!propertyId) return;
      const messageBody = buildSharedHomeAttachmentMessage(home);
      await executeSendSharedAttachment({
        conversationId,
        mode,
        clientIdForSending: clientId,
        messageRole,
        messageBody,
        sharedHomeId: propertyId,
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
      clientId,
      messageRole,
      sendMessageApi,
      refreshChats,
      setLocalMessages,
      getChatHistoryRef,
      loadedHistoryIdsRef,
    ],
  );

  const sendSharedDocument = useCallback(
    async (document: DocumentData) => {
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      const messageBody = buildSharedDocumentAttachmentMessage(document);
      await executeSendSharedAttachment({
        conversationId,
        mode,
        clientIdForSending: clientId,
        messageRole,
        messageBody,
        sharedDocumentId: document.id,
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
      clientId,
      messageRole,
      sendMessageApi,
      refreshChats,
      setLocalMessages,
      getChatHistoryRef,
      loadedHistoryIdsRef,
    ],
  );

  const retryMessage = useCallback(
    async (messageId: string) => {
      const failedMessage = localMessages.find(
        (msg) => msg.id === messageId && msg.status === "failed",
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
        sharedHomeId: failedMessage.shared_home_id ?? undefined,
        sharedDocumentId: failedMessage.shared_document_id ?? undefined,
        messageRole: failedMessage.role,
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
    ],
  );

  return { sendMessage, sendSharedHome, sendSharedDocument, retryMessage };
}
