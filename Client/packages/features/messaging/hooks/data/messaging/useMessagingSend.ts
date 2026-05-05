/**
 * Send and retry message logic for useMessaging. Extracted to keep main hook under max-lines-per-function.
 */

import { useCallback } from "react";

import type { SharedBundleItemV1 } from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import {
  buildSharedBundleAttachmentMessage,
  buildSharedDocumentsAttachmentMessage,
  buildSharedHomesAttachmentMessage,
} from "packages/features/messaging/utils/sharedAttachmentSnapshot";
import type { SavedHome } from "packages/types/domain/savedHome";
import type { DocumentData } from "packages/ui/components/cards/document/types";

import type { GetChatHistoryRef } from "./useMessagingHistory.effect";
import type { ChatMessage, MessagingSendMessageOptions, UseMessagingConfig } from "./types";
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
    sharedDocumentId?: string
  ) => Promise<void>;
  refreshChats: () => Promise<void>;
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getChatHistoryRef: React.MutableRefObject<GetChatHistoryRef>;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
};

export type UseMessagingSendReturn = {
  sendMessage: (messageText: string, options?: MessagingSendMessageOptions) => Promise<void>;
  sendSharedHomes: (homes: SavedHome[]) => Promise<void>;
  sendSharedDocument: (document: DocumentData) => Promise<void>;
  sendSharedDocuments: (documents: DocumentData[]) => Promise<void>;
  sendSharedBundle: (items: SharedBundleItemV1[]) => Promise<void>;
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
        mode === "agent" ? (options?.clientIdForAgent ?? clientId) : undefined;
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
    ]
  );

  const sendSharedHomes = useCallback(
    async (homes: SavedHome[]) => {
      if (homes.length === 0) return;
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      const first = homes[0];
      const propertyId = (first.home_id || first.address || "").trim();
      if (!propertyId) return;
      const messageBody = buildSharedHomesAttachmentMessage(homes);
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
    ]
  );

  const sendSharedDocuments = useCallback(
    async (documents: DocumentData[]) => {
      if (documents.length === 0) return;
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      const first = documents[0];
      const docId = (first.id || "").trim();
      if (!docId) return;
      const messageBody = buildSharedDocumentsAttachmentMessage(documents);
      await executeSendSharedAttachment({
        conversationId,
        mode,
        clientIdForSending: clientId,
        messageRole,
        messageBody,
        sharedDocumentId: docId,
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
    ]
  );

  const sendSharedDocument = useCallback(
    async (document: DocumentData) => {
      await sendSharedDocuments([document]);
    },
    [sendSharedDocuments]
  );

  const sendSharedBundle = useCallback(
    async (items: SharedBundleItemV1[]) => {
      if (items.length < 2) return;
      const conversationId = resolveConversationIdForSend({
        mode,
        activeConversationId,
        agentId,
        clientIdForSending,
      });
      if (conversationId === null) return;
      const messageBody = buildSharedBundleAttachmentMessage(items);
      const firstHome = items.find((i) => i.type === "home");
      const firstDoc = items.find((i) => i.type === "document");
      const sharedHomeId = firstHome ? firstHome.home.home_id.trim() : undefined;
      const sharedDocumentId = firstDoc ? firstDoc.document.id.trim() : undefined;
      await executeSendSharedAttachment({
        conversationId,
        mode,
        clientIdForSending: clientId,
        messageRole,
        messageBody,
        sharedHomeId: sharedHomeId || undefined,
        sharedDocumentId: sharedDocumentId || undefined,
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
    ]
  );

  return {
    sendMessage,
    sendSharedHomes,
    sendSharedDocument,
    sendSharedDocuments,
    sendSharedBundle,
    retryMessage,
  };
}
