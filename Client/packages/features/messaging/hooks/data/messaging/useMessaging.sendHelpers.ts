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
  tempMessageId: string,
  userContent: string,
  tempTimestamp: Date | undefined
): ChatMessage[] {
  if (!tempTimestamp) return serverMessages;
  return serverMessages.map((msg) => {
    if (
      msg.role === "user" &&
      msg.content === userContent &&
      Math.abs(msg.timestamp.getTime() - tempTimestamp.getTime()) < TIMESTAMP_MATCH_MS
    ) {
      return { ...msg, timestamp: tempTimestamp };
    }
    return msg;
  });
}

export type ExecuteSendMessageParams = {
  userMessage: string;
  conversationId: string;
  mode: "client" | "agent";
  clientIdForSending: string | undefined;
  messageRole: "user" | "agent";
  sendMessageApi: (conversationId: string, message: string, clientId?: string) => Promise<void>;
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
          tempMessage?.timestamp
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
  sendMessageApi: (conversationId: string, message: string, clientId?: string) => Promise<void>;
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
    sendMessageApi,
    refreshChats,
    setLocalMessages,
    getChatHistoryRef,
    loadedHistoryIdsRef,
  } = params;
  setLocalMessages((prev) =>
    prev.map((msg) => (msg.id === messageId ? { ...msg, status: "sending" as const } : msg))
  );
  try {
    if (mode === "agent") {
      await sendMessageApi(conversationId, content, clientIdForSending);
    } else {
      await sendMessageApi(conversationId, content);
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
        return mergeServerMessagesPreservingTimestamp(
          messages,
          messageId,
          content,
          failed?.timestamp
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
