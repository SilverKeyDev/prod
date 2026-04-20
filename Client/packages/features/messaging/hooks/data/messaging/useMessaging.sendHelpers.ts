/**
 * Helpers for useMessaging send/retry to keep the main hook under max-lines-per-function.
 */

import { dateNow } from "packages/utils/date";

import { mapApiMessagesToChatMessages } from "./helpers";
import type { ChatMessage } from "./types";

export type SendResolveConversationIdParams = {
  mode: "client" | "agent";
  activeConversationId: string;
  agentId?: string;
  clientIdForSending?: string;
};

/**
 * Resolve conversationId for sending (new vs existing).
 */
export function resolveConversationIdForSend(
  params: SendResolveConversationIdParams
): string | null {
  const { mode, activeConversationId, agentId, clientIdForSending } = params;
  let conversationId = activeConversationId;
  if (mode === "client" && !conversationId && agentId) conversationId = "new";
  if (mode === "agent" && !conversationId && clientIdForSending) conversationId = "new";
  if (mode === "client" && !conversationId && !agentId) return null;
  if (mode === "agent" && !conversationId && !clientIdForSending) return null;
  return conversationId;
}

const TIMESTAMP_MATCH_MS = 60000;

/**
 * Merge server messages with local list, preserving timestamp of a sent message
 * when it matches by role, content, and approximate time.
 */
export function mergeServerMessagesPreservingTimestamp(
  serverMessages: ChatMessage[],
  _tempMessageId: string,
  userContent: string,
  tempTimestamp: Date | undefined,
  senderRole: "user" | "agent"
): ChatMessage[] {
  if (!tempTimestamp) return serverMessages;
  return serverMessages.map((msg) => {
    if (
      msg.role === senderRole &&
      msg.content === userContent &&
      Math.abs(msg.timestamp.getTime() - tempTimestamp.getTime()) < TIMESTAMP_MATCH_MS
    ) {
      return { ...msg, timestamp: tempTimestamp };
    }
    return msg;
  });
}

/**
 * After sharing a home/document, align server row timestamp with the optimistic bubble.
 */
export function mergeServerMessagesPreservingSharedSend(
  serverMessages: ChatMessage[],
  tempTimestamp: Date | undefined,
  sharedHomeId: string | undefined,
  sharedDocumentId: string | undefined,
  messageRole: "user" | "agent"
): ChatMessage[] {
  if (!tempTimestamp) return serverMessages;
  return serverMessages.map((msg) => {
    if (msg.role !== messageRole) return msg;
    const homeMatch = Boolean(sharedHomeId && msg.shared_home_id === sharedHomeId);
    const docMatch = Boolean(sharedDocumentId && msg.shared_document_id === sharedDocumentId);
    if (
      (homeMatch || docMatch) &&
      Math.abs(msg.timestamp.getTime() - tempTimestamp.getTime()) < TIMESTAMP_MATCH_MS
    ) {
      return { ...msg, timestamp: tempTimestamp };
    }
    return msg;
  });
}

export type SendMessageApiFn = (
  conversationId: string,
  message: string,
  clientId?: string,
  sharedHomeId?: string,
  sharedDocumentId?: string
) => Promise<void>;

export type ExecuteSendMessageParams = {
  userMessage: string;
  conversationId: string;
  mode: "client" | "agent";
  clientIdForSending: string | undefined;
  messageRole: "user" | "agent";
  sendMessageApi: SendMessageApiFn;
  refreshChats: () => Promise<void>;
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getChatHistoryRef: React.MutableRefObject<(id: string) => Promise<{ messages: unknown[] }>>;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
};

export async function executeSendMessage(params: ExecuteSendMessageParams): Promise<void> {
  const {
    userMessage,
    conversationId,
    mode,
    clientIdForSending,
    messageRole,
    sendMessageApi,
    refreshChats,
    setLocalMessages,
    getChatHistoryRef,
    loadedHistoryIdsRef,
  } = params;
  const tempMessageId = `temp-${Date.now()}`;
  const isEventRequest = userMessage.startsWith("__EVENT_REQUEST__");
  const newMessage: ChatMessage = {
    id: tempMessageId,
    content: userMessage,
    role: messageRole,
    timestamp: dateNow().toDate(),
    status: "sending",
    ...(isEventRequest && { event_request_status: "pending" as const }),
  };
  setLocalMessages((prev) => [...prev, newMessage]);
  try {
    if (mode === "agent") {
      await sendMessageApi(conversationId, userMessage, clientIdForSending);
    } else {
      await sendMessageApi(conversationId, userMessage);
    }
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === tempMessageId ? { ...msg, status: "delivered" as const } : msg))
    );
    await refreshChats();
    if (conversationId !== "new") {
      const data = await getChatHistoryRef.current(conversationId);
      const messages = mapApiMessagesToChatMessages(data.messages ?? []);
      setLocalMessages((prev) => {
        const tempMessage = prev.find((msg) => msg.id === tempMessageId);
        return mergeServerMessagesPreservingTimestamp(
          messages,
          tempMessageId,
          userMessage,
          tempMessage?.timestamp,
          messageRole
        );
      });
    } else {
      loadedHistoryIdsRef.current.clear();
    }
  } catch {
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === tempMessageId ? { ...msg, status: "failed" as const } : msg))
    );
  }
}

export type ExecuteSendSharedAttachmentParams = {
  conversationId: string;
  mode: "client" | "agent";
  clientIdForSending: string | undefined;
  messageRole: "user" | "agent";
  /** Persisted message body (includes embedded snapshot JSON for home/document shares). */
  messageBody: string;
  sharedHomeId?: string;
  sharedDocumentId?: string;
  sendMessageApi: SendMessageApiFn;
  refreshChats: () => Promise<void>;
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getChatHistoryRef: React.MutableRefObject<(id: string) => Promise<{ messages: unknown[] }>>;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
};

export async function executeSendSharedAttachment(
  params: ExecuteSendSharedAttachmentParams
): Promise<void> {
  const {
    conversationId,
    mode,
    clientIdForSending,
    messageRole,
    messageBody,
    sharedHomeId,
    sharedDocumentId,
    sendMessageApi,
    refreshChats,
    setLocalMessages,
    getChatHistoryRef,
    loadedHistoryIdsRef,
  } = params;
  const tempMessageId = `temp-${Date.now()}`;
  const newMessage: ChatMessage = {
    id: tempMessageId,
    content: messageBody,
    role: messageRole,
    timestamp: dateNow().toDate(),
    status: "sending",
    ...(sharedHomeId ? { shared_home_id: sharedHomeId } : {}),
    ...(sharedDocumentId ? { shared_document_id: sharedDocumentId } : {}),
  };
  setLocalMessages((prev) => [...prev, newMessage]);
  try {
    if (mode === "agent") {
      await sendMessageApi(
        conversationId,
        messageBody,
        clientIdForSending,
        sharedHomeId,
        sharedDocumentId
      );
    } else {
      await sendMessageApi(conversationId, messageBody, undefined, sharedHomeId, sharedDocumentId);
    }
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === tempMessageId ? { ...msg, status: "delivered" as const } : msg))
    );
    await refreshChats();
    if (conversationId !== "new") {
      const data = await getChatHistoryRef.current(conversationId);
      const messages = mapApiMessagesToChatMessages(data.messages ?? []);
      setLocalMessages((prev) => {
        const tempMessage = prev.find((msg) => msg.id === tempMessageId);
        return mergeServerMessagesPreservingSharedSend(
          messages,
          tempMessage?.timestamp,
          sharedHomeId,
          sharedDocumentId,
          messageRole
        );
      });
    } else {
      loadedHistoryIdsRef.current.clear();
    }
  } catch {
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === tempMessageId ? { ...msg, status: "failed" as const } : msg))
    );
  }
}

export type ExecuteRetryMessageParams = {
  messageId: string;
  conversationId: string;
  mode: "client" | "agent";
  clientIdForSending: string | undefined;
  content: string;
  sharedHomeId?: string;
  sharedDocumentId?: string;
  messageRole: "user" | "agent";
  sendMessageApi: SendMessageApiFn;
  refreshChats: () => Promise<void>;
  setLocalMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  getChatHistoryRef: React.MutableRefObject<(id: string) => Promise<{ messages: unknown[] }>>;
  loadedHistoryIdsRef: React.MutableRefObject<Set<string>>;
};

export async function executeRetryMessage(params: ExecuteRetryMessageParams): Promise<void> {
  const {
    messageId,
    conversationId,
    mode,
    clientIdForSending,
    content,
    sharedHomeId,
    sharedDocumentId,
    messageRole,
    sendMessageApi,
    refreshChats,
    setLocalMessages,
    getChatHistoryRef,
    loadedHistoryIdsRef,
  } = params;
  const isShared = Boolean(sharedHomeId || sharedDocumentId);
  const body = content;
  setLocalMessages((prev) =>
    prev.map((msg) => (msg.id === messageId ? { ...msg, status: "sending" as const } : msg))
  );
  try {
    if (mode === "agent") {
      await sendMessageApi(
        conversationId,
        body,
        clientIdForSending,
        isShared ? sharedHomeId : undefined,
        isShared ? sharedDocumentId : undefined
      );
    } else {
      await sendMessageApi(
        conversationId,
        body,
        undefined,
        isShared ? sharedHomeId : undefined,
        isShared ? sharedDocumentId : undefined
      );
    }
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status: "delivered" as const } : msg))
    );
    await refreshChats();
    if (conversationId !== "new") {
      const data = await getChatHistoryRef.current(conversationId);
      const messages = mapApiMessagesToChatMessages(data.messages ?? []);
      setLocalMessages((prev) => {
        const failed = prev.find((msg) => msg.id === messageId);
        if (!failed?.timestamp) return messages;
        if (failed.shared_home_id || failed.shared_document_id) {
          return mergeServerMessagesPreservingSharedSend(
            messages,
            failed.timestamp,
            failed.shared_home_id ?? undefined,
            failed.shared_document_id ?? undefined,
            messageRole
          );
        }
        return mergeServerMessagesPreservingTimestamp(
          messages,
          messageId,
          content,
          failed.timestamp,
          messageRole
        );
      });
    } else {
      loadedHistoryIdsRef.current.clear();
    }
  } catch {
    setLocalMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, status: "failed" as const } : msg))
    );
  }
}
