import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAgentChats } from "./useAgentChats";
import { useNotificationStore } from "../../../store/notifications.slice";
import { agentApi } from "../../../config/api";
import { queryKeys } from "../../../config/query/keys";
import type { AgentConversation, AgentChatMessage } from "../../../config/api";
import { log, LOG_CATEGORIES } from "../../../../logger";

export type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
  shared_document_id?: string | null;
  is_read?: boolean;
  read_at?: string | null;
  status?: "sending" | "delivered" | "failed";
};

export type UseMessagingConfig = {
  /**
   * Mode: "client" for non-agent users, "agent" for agent users
   */
  mode: "client" | "agent";
  /**
   * For client mode: user's ID to find their conversation
   * For agent mode: selected client ID to find conversation
   */
  conversationSelector: string | null | undefined;
  /**
   * For agent mode: the selected client ID to pass when sending messages
   */
  clientIdForSending?: string | null;
  /**
   * For client mode: agent ID if available (for creating new conversations)
   */
  agentId?: string | null;
};

export type UseMessagingReturn = {
  // State
  localMessages: ChatMessage[];
  activeConversationId: string;
  isLoadingHistory: boolean;
  activeConversation: AgentConversation | null | undefined;
  conversations: AgentConversation[];

  // Actions
  sendMessage: (message: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  setActiveConversationId: (id: string) => void;

  // Utilities
  formatTime: (date: Date) => string;
  canSendMessage: boolean;
};

/**
 * Shared hook for messaging functionality that works for both clients and agents.
 * Handles loading chat history, sending messages, tracking timestamps, and marking conversations as read.
 */
export function useMessaging(config: UseMessagingConfig): UseMessagingReturn {
  const { mode, conversationSelector, clientIdForSending, agentId } = config;
  const queryClient = useQueryClient();

  const {
    conversations,
    sendMessage: sendMessageApi,
    getChatHistory,
    refreshChats,
  } = useAgentChats(
    mode === "agent" ? (conversationSelector ?? undefined) : undefined,
  );

  // Use selectors to get store actions - these are stable references
  const markConversationRead = useNotificationStore(
    (s) => s.markConversationRead,
  );
  const updateLastReadTimestamp = useNotificationStore(
    (s) => s.updateLastReadTimestamp,
  );
  const setActiveConversationIdInStore = useNotificationStore(
    (s) => s.setActiveConversationId,
  );

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationIdState] =
    useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const getChatHistoryRef = useRef(getChatHistory);

  // Find the active conversation based on mode
  // Both modes use the same logic: find conversation where client_id matches conversationSelector
  // - Client mode: conversationSelector is the current user's ID (they are the client)
  // - Agent mode: conversationSelector is the selected client's ID
  const activeConversation = useMemo(() => {
    if (!conversationSelector || conversations.length === 0) return null;
    return (
      conversations.find((c) => c.client_id === conversationSelector) ?? null
    );
  }, [conversations, conversationSelector]);

  // Memoize the current conversation's last_message_at to prevent unnecessary recalculations
  const currentConversationLastMessageAt = useMemo(() => {
    if (!activeConversationId) return 0;
    const conv = conversations.find((c) => c.id === activeConversationId);
    return conv?.last_message_at ? new Date(conv.last_message_at).getTime() : 0;
  }, [activeConversationId, conversations]);

  // Set active conversation ID when conversation is found
  useEffect(() => {
    const newId = activeConversation?.id ?? "";
    if (activeConversationId !== newId) {
      setActiveConversationIdState(newId);
      setActiveConversationIdInStore(newId || null);
    }
  }, [
    activeConversation?.id,
    activeConversationId,
    setActiveConversationIdInStore,
  ]);

  // Keep ref updated with latest getChatHistory function
  useEffect(() => {
    getChatHistoryRef.current = getChatHistory;
  }, [getChatHistory]);

  // Track last known message timestamp for the active conversation
  const lastKnownMessageTimestampRef = useRef<number>(0);
  const lastConversationIdRef = useRef<string>("");
  const lastMessageAtRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  // Helper function to map API messages to ChatMessage format
  const mapApiMessagesToChatMessages = useCallback(
    (
      apiMessages: Array<{
        id: string;
        message: string;
        role: string;
        timestamp: string;
        shared_home_id?: string | null;
        shared_document_id?: string | null;
        is_read?: boolean;
        read_at?: string | null;
      }>,
    ): ChatMessage[] => {
      return apiMessages.map((msg) => ({
        id: msg.id,
        content: msg.message,
        role: msg.role === "agent" ? "agent" : "user",
        timestamp: new Date(msg.timestamp),
        shared_home_id: msg.shared_home_id ?? null,
        shared_document_id: msg.shared_document_id ?? null,
        is_read: msg.is_read ?? false,
        read_at: msg.read_at ?? null,
        status: "delivered" as const, // Messages from server are always delivered
      }));
    },
    [],
  );

  // Load chat history when conversation changes or when new messages are detected
  useEffect(() => {
    if (!activeConversationId) {
      setLocalMessages([]);
      lastKnownMessageTimestampRef.current = 0;
      lastConversationIdRef.current = "";
      lastMessageAtRef.current = 0;
      isLoadingRef.current = false;
      return;
    }

    // Prevent duplicate requests - if already loading, skip
    if (isLoadingRef.current) {
      return;
    }

    // Check for cached chat history first
    const cachedHistory = queryClient.getQueryData<{
      messages: AgentChatMessage[];
      conversation?: AgentConversation;
    }>(queryKeys.agent.history(activeConversationId));

    // Use memoized timestamp to avoid unnecessary recalculations
    const currentLastMessageAt = currentConversationLastMessageAt;

    // Check if conversation ID changed (need to reload)
    const conversationChanged =
      lastConversationIdRef.current !== activeConversationId;

    // Check if there are new messages (timestamp increased)
    const hasNewMessages =
      currentLastMessageAt > lastKnownMessageTimestampRef.current;

    // Check if the lastMessageAt from conversations actually changed (not just array reference)
    const messageTimestampChanged =
      currentLastMessageAt !== lastMessageAtRef.current;

    // Determine if this is an initial load (conversation changed or first time loading)
    // vs a polling update (same conversation, already loaded, just checking for new messages)
    const isInitialLoad =
      conversationChanged ||
      !loadedHistoryIdsRef.current.has(activeConversationId);

    // If we have cached history and this is an initial load, show it immediately
    if (cachedHistory && isInitialLoad) {
      const cachedMessages = mapApiMessagesToChatMessages(
        cachedHistory.messages ?? [],
      );
      setLocalMessages(cachedMessages);
      loadedHistoryIdsRef.current.add(activeConversationId);

      // Update last known timestamp from cached messages
      if (cachedMessages.length > 0) {
        const latestMessage = cachedMessages[cachedMessages.length - 1];
        lastKnownMessageTimestampRef.current =
          latestMessage.timestamp.getTime();
        lastMessageAtRef.current = latestMessage.timestamp.getTime();
      }

      // Mark conversation as read
      markConversationRead(activeConversationId);
      void agentApi.markMessagesAsRead(activeConversationId).catch((err) => {
        log.error(
          LOG_CATEGORIES.MESSAGES,
          "Failed to mark messages as read",
          err,
        );
      });

      // Update last read timestamp
      if (cachedMessages.length > 0) {
        const latestMessage = cachedMessages[cachedMessages.length - 1];
        updateLastReadTimestamp(
          activeConversationId,
          latestMessage.timestamp.getTime(),
        );
      }

      // Update refs
      lastConversationIdRef.current = activeConversationId;

      // Still fetch fresh data in background (but don't show loading)
      void getChatHistoryRef
        .current(activeConversationId)
        .then((data) => {
          if (lastConversationIdRef.current === activeConversationId) {
            const messages = mapApiMessagesToChatMessages(data.messages ?? []);
            setLocalMessages(messages);

            if (messages.length > 0) {
              const latestMessage = messages[messages.length - 1];
              lastKnownMessageTimestampRef.current =
                latestMessage.timestamp.getTime();
              lastMessageAtRef.current = latestMessage.timestamp.getTime();
            }
          }
        })
        .catch(() => {
          // Error handled silently - we already have cached data
        });

      return;
    }

    // Only reload if:
    // 1. Conversation changed, OR
    // 2. We haven't loaded this conversation yet, OR
    // 3. The message timestamp actually changed AND there are new messages (polling update)
    const shouldReload =
      conversationChanged ||
      !loadedHistoryIdsRef.current.has(activeConversationId) ||
      (messageTimestampChanged && hasNewMessages);

    if (!shouldReload) {
      // Still mark as read even if already loaded
      markConversationRead(activeConversationId);
      // Mark messages as read on backend
      void agentApi.markMessagesAsRead(activeConversationId).catch((err) => {
        log.error(
          LOG_CATEGORIES.MESSAGES,
          "Failed to mark messages as read",
          err,
        );
      });
      return;
    }

    // Update refs
    lastConversationIdRef.current = activeConversationId;
    if (currentLastMessageAt > 0) {
      lastMessageAtRef.current = currentLastMessageAt;
      lastKnownMessageTimestampRef.current = currentLastMessageAt;
    }

    // Mark as loading to prevent duplicate requests
    isLoadingRef.current = true;

    let cancelled = false;
    const loadHistory = async () => {
      // Only show loading indicator for initial loads without cache, not polling updates
      if (isInitialLoad && !cachedHistory) {
        setIsLoadingHistory(true);
      }
      try {
        const data = await getChatHistoryRef.current(activeConversationId);
        if (!cancelled) {
          loadedHistoryIdsRef.current.add(activeConversationId);
          const messages = mapApiMessagesToChatMessages(data.messages ?? []);
          setLocalMessages(messages);

          // Update last known timestamp to the latest message
          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            lastKnownMessageTimestampRef.current =
              latestMessage.timestamp.getTime();
            lastMessageAtRef.current = latestMessage.timestamp.getTime();
          }

          // Mark conversation as read when messages are loaded
          markConversationRead(activeConversationId);

          // Mark messages as read on backend
          try {
            await agentApi.markMessagesAsRead(activeConversationId);
          } catch (err) {
            log.error(
              LOG_CATEGORIES.MESSAGES,
              "Failed to mark messages as read",
              err,
            );
          }

          // Update last read timestamp to the latest message timestamp
          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            updateLastReadTimestamp(
              activeConversationId,
              latestMessage.timestamp.getTime(),
            );
          }
        }
      } catch (err) {
        // Error is handled by the query's error state
      } finally {
        if (!cancelled) {
          // Only hide loading indicator if we showed it (initial load without cache)
          if (isInitialLoad && !cachedHistory) {
            setIsLoadingHistory(false);
          }
          isLoadingRef.current = false;
        }
      }
    };

    void loadHistory();

    return () => {
      cancelled = true;
      isLoadingRef.current = false;
    };
  }, [
    activeConversationId,
    currentConversationLastMessageAt,
    markConversationRead,
    updateLastReadTimestamp,
    mapApiMessagesToChatMessages,
    queryClient,
  ]);

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim()) return;

      // Determine conversation ID and role based on mode
      let conversationId = activeConversationId;
      const messageRole: "user" | "agent" =
        mode === "client" ? "user" : "agent";

      // For client mode: if no conversation exists but agent is assigned, create one
      if (mode === "client" && !conversationId && agentId) {
        conversationId = "new";
      }

      // For agent mode: if no conversation exists, create one
      if (mode === "agent" && !conversationId && clientIdForSending) {
        conversationId = "new";
      }

      // Validate we can send
      if (mode === "client" && !conversationId && !agentId) return;
      if (mode === "agent" && !conversationId && !clientIdForSending) return;

      const userMessage = messageText.trim();
      const tempMessageId = `temp-${Date.now()}`;
      const newMessage: ChatMessage = {
        id: tempMessageId,
        content: userMessage,
        role: messageRole,
        timestamp: new Date(),
        status: "sending",
      };

      // Optimistic append with "sending" status
      setLocalMessages((prev) => [...prev, newMessage]);

      try {
        // Send message with appropriate parameters based on mode
        // Agent mode requires clientId when creating new conversations
        if (mode === "agent") {
          await sendMessageApi(
            conversationId,
            userMessage,
            clientIdForSending || undefined,
          );
        } else {
          // Client mode: no clientId needed (backend determines from auth)
          await sendMessageApi(conversationId, userMessage);
        }

        // Mark message as delivered
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId
              ? { ...msg, status: "delivered" as const }
              : msg,
          ),
        );

        // Reload conversations to get the new conversation ID if it was created
        await refreshChats();

        // Reload history to get server response and replace temp message with real one
        if (conversationId !== "new") {
          const data = await getChatHistoryRef.current(conversationId);
          const messages = mapApiMessagesToChatMessages(data.messages ?? []);

          // Preserve the original timestamp from temp message when replacing
          setLocalMessages((prev) => {
            const tempMessage = prev.find((msg) => msg.id === tempMessageId);
            const tempTimestamp = tempMessage?.timestamp;

            return messages.map((msg) => {
              // If this is the message we just sent (matches content and is user message),
              // and we have a temp message timestamp, preserve it to avoid timezone issues
              if (
                tempTimestamp &&
                msg.role === "user" &&
                msg.content === userMessage &&
                Math.abs(msg.timestamp.getTime() - tempTimestamp.getTime()) <
                  60000 // Within 1 minute
              ) {
                return { ...msg, timestamp: tempTimestamp };
              }
              return msg;
            });
          });
        } else {
          // If we created a new conversation, refresh conversations to get it
          await refreshChats();
          // Clear loaded history cache so it reloads
          loadedHistoryIdsRef.current.clear();
        }
      } catch (error) {
        // Mark message as failed instead of removing it
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessageId
              ? { ...msg, status: "failed" as const }
              : msg,
          ),
        );
      }
    },
    [
      activeConversationId,
      mode,
      agentId,
      clientIdForSending,
      sendMessageApi,
      refreshChats,
      mapApiMessagesToChatMessages,
    ],
  );

  const setActiveConversationId = useCallback(
    (id: string) => {
      setActiveConversationIdState(id);
      setActiveConversationIdInStore(id || null);
    },
    [setActiveConversationIdInStore],
  );

  const formatTime = useCallback((date: Date) => {
    const d =
      date instanceof Date && !isNaN(date.getTime()) ? date : new Date();

    const now = new Date();
    const diffInMs = now.getTime() - d.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    // If message is older than 24 hours, show date
    if (diffInHours > 24) {
      // Check if it's from this year
      const isThisYear = d.getFullYear() === now.getFullYear();

      if (isThisYear) {
        // Show month and day (e.g., "Jan 15")
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      } else {
        // Show month, day, and year (e.g., "Jan 15, 2023")
        return d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      }
    }

    // Within 24 hours, show time
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Determine if user can send messages based on mode
  // Client mode: can send if conversation exists OR agent is assigned (can create conversation)
  // Agent mode: can send if a client is selected
  const retryMessage = useCallback(
    async (messageId: string) => {
      const failedMessage = localMessages.find(
        (msg) => msg.id === messageId && msg.status === "failed",
      );
      if (!failedMessage) return;

      // Update message status to sending
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, status: "sending" as const } : msg,
        ),
      );

      // Determine conversation ID and role based on mode
      let conversationId = activeConversationId;
      const messageRole: "user" | "agent" =
        mode === "client" ? "user" : "agent";

      // For client mode: if no conversation exists but agent is assigned, create one
      if (mode === "client" && !conversationId && agentId) {
        conversationId = "new";
      }

      // For agent mode: if no conversation exists, create one
      if (mode === "agent" && !conversationId && clientIdForSending) {
        conversationId = "new";
      }

      // Validate we can send
      if (mode === "client" && !conversationId && !agentId) return;
      if (mode === "agent" && !conversationId && !clientIdForSending) return;

      try {
        // Send message with appropriate parameters based on mode
        if (mode === "agent") {
          await sendMessageApi(
            conversationId,
            failedMessage.content,
            clientIdForSending || undefined,
          );
        } else {
          await sendMessageApi(conversationId, failedMessage.content);
        }

        // Mark message as delivered
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: "delivered" as const }
              : msg,
          ),
        );

        // Reload conversations to get the new conversation ID if it was created
        await refreshChats();

        // Reload history to get server response
        if (conversationId !== "new") {
          const data = await getChatHistoryRef.current(conversationId);
          const messages = mapApiMessagesToChatMessages(data.messages ?? []);

          // Preserve the original timestamp from failed message when replacing
          setLocalMessages((prev) => {
            const failedMessage = prev.find((msg) => msg.id === messageId);
            const failedTimestamp = failedMessage?.timestamp;

            return messages.map((msg) => {
              // If this is the message we just retried (matches content and is user message),
              // and we have a failed message timestamp, preserve it to avoid timezone issues
              if (
                failedTimestamp &&
                msg.role === "user" &&
                msg.content === failedMessage.content &&
                Math.abs(msg.timestamp.getTime() - failedTimestamp.getTime()) <
                  60000 // Within 1 minute
              ) {
                return { ...msg, timestamp: failedTimestamp };
              }
              return msg;
            });
          });
        } else {
          await refreshChats();
          loadedHistoryIdsRef.current.clear();
        }
      } catch (error) {
        // Mark message as failed again
        setLocalMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, status: "failed" as const } : msg,
          ),
        );
      }
    },
    [
      localMessages,
      activeConversationId,
      mode,
      agentId,
      clientIdForSending,
      sendMessageApi,
      refreshChats,
      mapApiMessagesToChatMessages,
    ],
  );

  const canSendMessage = useMemo(() => {
    if (mode === "client") {
      return !!(activeConversationId || agentId);
    } else {
      // Agent mode: requires selected client
      return !!clientIdForSending;
    }
  }, [mode, activeConversationId, agentId, clientIdForSending]);

  return {
    localMessages,
    activeConversationId,
    isLoadingHistory,
    activeConversation,
    conversations,
    sendMessage,
    retryMessage,
    setActiveConversationId,
    formatTime,
    canSendMessage,
  };
}
