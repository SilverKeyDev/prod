import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAgentChats } from "./useAgentChats";
import { useNotificationStore } from "../../store/notifications.slice";
import type { AgentConversation } from "../../config/api/agent";

export type ChatMessage = {
  id: string;
  content: string;
  role: "user" | "agent";
  timestamp: Date;
  shared_home_id?: string | null;
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
  
  const { conversations, sendMessage: sendMessageApi, getChatHistory, refreshChats } =
    useAgentChats(mode === "agent" ? conversationSelector ?? undefined : undefined);
  
  const {
    markConversationRead,
    updateLastReadTimestamp,
    setActiveConversationId: setActiveConversationIdInStore,
  } = useNotificationStore();

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationIdState] = useState<string>("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadedHistoryIdsRef = useRef<Set<string>>(new Set());
  const getChatHistoryRef = useRef(getChatHistory);

  // Find the active conversation based on mode
  // Both modes use the same logic: find conversation where client_id matches conversationSelector
  // - Client mode: conversationSelector is the current user's ID (they are the client)
  // - Agent mode: conversationSelector is the selected client's ID
  const activeConversation = useMemo(() => {
    if (!conversationSelector || conversations.length === 0) return null;
    return conversations.find((c) => c.client_id === conversationSelector) ?? null;
  }, [conversations, conversationSelector]);

  // Memoize the current conversation's last_message_at to prevent unnecessary recalculations
  const currentConversationLastMessageAt = useMemo(() => {
    if (!activeConversationId) return 0;
    const conv = conversations.find((c) => c.id === activeConversationId);
    return conv?.last_message_at
      ? new Date(conv.last_message_at).getTime()
      : 0;
  }, [activeConversationId, conversations]);

  // Set active conversation ID when conversation is found
  useEffect(() => {
    const newId = activeConversation?.id ?? "";
    if (activeConversationId !== newId) {
      setActiveConversationIdState(newId);
      setActiveConversationIdInStore(newId || null);
    }
  }, [activeConversation?.id, activeConversationId, setActiveConversationIdInStore]);

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
  const mapApiMessagesToChatMessages = useCallback((apiMessages: Array<{ id: string; message: string; role: string; timestamp: string; shared_home_id?: string | null }>): ChatMessage[] => {
    return apiMessages.map((msg) => ({
      id: msg.id,
      content: msg.message,
      role: msg.role === "agent" ? "agent" : "user",
      timestamp: new Date(msg.timestamp),
      shared_home_id: msg.shared_home_id ?? null,
    }));
  }, []);

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

    // Use memoized timestamp to avoid unnecessary recalculations
    const currentLastMessageAt = currentConversationLastMessageAt;

    // Check if conversation ID changed (need to reload)
    const conversationChanged = lastConversationIdRef.current !== activeConversationId;
    
    // Check if there are new messages (timestamp increased)
    const hasNewMessages = currentLastMessageAt > lastKnownMessageTimestampRef.current;
    
    // Check if the lastMessageAt from conversations actually changed (not just array reference)
    const messageTimestampChanged = currentLastMessageAt !== lastMessageAtRef.current;
    
    // Determine if this is an initial load (conversation changed or first time loading)
    // vs a polling update (same conversation, already loaded, just checking for new messages)
    const isInitialLoad = conversationChanged || !loadedHistoryIdsRef.current.has(activeConversationId);
    
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
      // Only show loading indicator for initial loads, not polling updates
      if (isInitialLoad) {
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
            lastKnownMessageTimestampRef.current = latestMessage.timestamp.getTime();
            lastMessageAtRef.current = latestMessage.timestamp.getTime();
          }

          // Mark conversation as read when messages are loaded
          markConversationRead(activeConversationId);

          // Update last read timestamp to the latest message timestamp
          if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            updateLastReadTimestamp(
              activeConversationId,
              latestMessage.timestamp.getTime()
            );
          }
        }
      } catch (err) {
        // Error is handled by the query's error state
      } finally {
        if (!cancelled) {
          // Only hide loading indicator if we showed it (initial load)
          if (isInitialLoad) {
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
  ]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    // Determine conversation ID and role based on mode
    let conversationId = activeConversationId;
    const messageRole: "user" | "agent" = mode === "client" ? "user" : "agent";

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
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: userMessage,
      role: messageRole,
      timestamp: new Date(),
    };

    // Optimistic append
    setLocalMessages((prev) => [...prev, newMessage]);

    try {
      // Send message with appropriate parameters based on mode
      // Agent mode requires clientId when creating new conversations
      if (mode === "agent") {
        await sendMessageApi(conversationId, userMessage, clientIdForSending || undefined);
      } else {
        // Client mode: no clientId needed (backend determines from auth)
        await sendMessageApi(conversationId, userMessage);
      }

      // Reload conversations to get the new conversation ID if it was created
      await refreshChats();

      // Reload history to get server response
      if (conversationId !== "new") {
        const data = await getChatHistoryRef.current(conversationId);
        const messages = mapApiMessagesToChatMessages(data.messages ?? []);
        setLocalMessages(messages);
      } else {
        // If we created a new conversation, refresh conversations to get it
        await refreshChats();
        // Clear loaded history cache so it reloads
        loadedHistoryIdsRef.current.clear();
      }
    } catch (error) {
      // Remove optimistic message on error
      setLocalMessages((prev) => prev.slice(0, -1));
    }
  }, [
    activeConversationId,
    mode,
    agentId,
    clientIdForSending,
    sendMessageApi,
    refreshChats,
    mapApiMessagesToChatMessages,
  ]);

  const setActiveConversationId = useCallback((id: string) => {
    setActiveConversationIdState(id);
    setActiveConversationIdInStore(id || null);
  }, [setActiveConversationIdInStore]);

  const formatTime = useCallback((date: Date) => {
    const d =
      date instanceof Date && !isNaN(date.getTime()) ? date : new Date();
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  // Determine if user can send messages based on mode
  // Client mode: can send if conversation exists OR agent is assigned (can create conversation)
  // Agent mode: can send if a client is selected
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
    setActiveConversationId,
    formatTime,
    canSendMessage,
  };
}

