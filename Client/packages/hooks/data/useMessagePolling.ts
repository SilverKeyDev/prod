import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../config/query/keys";
import { useNotificationStore } from "../../store/notifications.slice";
import type { AgentConversation } from "../../config/api/agent";
import { useAuthStore } from "../../store/auth.slice";
import { agentService } from "../../services/agent";

// Polling intervals in milliseconds
const POLLING_INTERVALS = {
  ACTIVE_PAGE: 8000, // 8 seconds when on messaging page
  OTHER_PAGE: 45000, // 45 seconds when elsewhere
  HIDDEN: 0, // Pause when tab is hidden
} as const;

/**
 * Hook that polls for new messages with adaptive intervals based on:
 * - Current route (frequent on /agent, less frequent elsewhere)
 * - Page visibility (pauses when tab is hidden)
 */
export function useMessagePolling() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  
  // Use selectors to get store actions - these are stable references
  // IMPORTANT: All hooks must be called unconditionally to maintain hook order
  const incrementUnreadCount = useNotificationStore((s) => s.incrementUnreadCount);
  const updateLastSeenMessageTimestamp = useNotificationStore((s) => s.updateLastSeenMessageTimestamp);
  
  // Use refs to track values that change frequently to avoid infinite loops
  // We'll access store values directly inside the callback instead of including them in dependencies
  // Initialize ref with current store state - getState() is safe to call during render
  const notificationStoreRef = useRef(useNotificationStore.getState());
  
  // Update ref when store changes (without causing re-renders)
  useEffect(() => {
    const unsubscribe = useNotificationStore.subscribe((state) => {
      notificationStoreRef.current = state;
    });
    return unsubscribe;
  }, []);
  
  const previousConversationsRef = useRef<AgentConversation[]>([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangeHandlerRef = useRef<(() => void) | null>(null);
  const isCheckingRef = useRef<boolean>(false); // Prevent concurrent checks
  
  // Debug logging
  useEffect(() => {
    console.log("[useMessagePolling] Hook initialized", {
      authReady,
      isAuthenticated,
      pathname: location.pathname,
      isOnMessagingPage: location.pathname.startsWith("/agent"),
    });
  }, [authReady, isAuthenticated, location.pathname]);

  // Check if we're on the messaging page
  const isOnMessagingPage = location.pathname.startsWith("/agent");

  // Determine polling interval based on route and visibility
  const getPollingInterval = (): number => {
    if (typeof document === "undefined") return POLLING_INTERVALS.OTHER_PAGE;
    
    if (document.visibilityState === "hidden") {
      return POLLING_INTERVALS.HIDDEN;
    }
    
    return isOnMessagingPage
      ? POLLING_INTERVALS.ACTIVE_PAGE
      : POLLING_INTERVALS.OTHER_PAGE;
  };

  // Check for new messages and update notifications
  const checkForNewMessages = useCallback(async () => {
    if (!authReady || !isAuthenticated) {
      console.log("[useMessagePolling] Skipping check - not ready", {
        authReady,
        isAuthenticated,
      });
      return;
    }

    // Prevent concurrent checks
    if (isCheckingRef.current) {
      console.log("[useMessagePolling] Check already in progress, skipping");
      return;
    }

    isCheckingRef.current = true;
    console.log("[useMessagePolling] Checking for new messages...");
    
    try {
      // Always fetch fresh data for polling to get latest message timestamps
      const queryKey = queryKeys.agent.conversations();
      console.log("[useMessagePolling] Fetching conversations with queryKey:", queryKey);
      
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => {
          console.log("[useMessagePolling] Executing queryFn to fetch chats");
          return agentService.fetchChats(); // Fetch all conversations for polling
        },
        staleTime: 0, // Force fresh fetch
      });
      
      const conversations = (result as AgentConversation[]) ?? [];
      console.log("[useMessagePolling] Fetched conversations:", {
        count: conversations.length,
        conversationIds: conversations.map((c) => c.id),
      });

      // Compare with previous conversations to detect new messages
      const previousConversations = previousConversationsRef.current;
      const storeState = notificationStoreRef.current;
      const activeConversationId = storeState.activeConversationId;
      const conversationsWithActualNewMessages: string[] = [];
      
      for (const conversation of conversations) {
        const conversationId = conversation.id;
        const lastMessageAt = conversation.last_message_at
          ? new Date(conversation.last_message_at).getTime()
          : 0;

        // Skip if no last message timestamp
        if (!lastMessageAt) continue;

        // Check if this is a new message compared to previous poll
        const previousConversation = previousConversations.find(
          (c) => c.id === conversationId
        );
        const previousLastMessageAt = previousConversation?.last_message_at
          ? new Date(previousConversation.last_message_at).getTime()
          : 0;

        // Get the last seen timestamp from store (what user has actually seen)
        const lastSeenTimestamp =
          storeState.lastSeenMessageTimestamp[conversationId] ?? 0;

        // Only consider it a "new message" if:
        // 1. The timestamp is newer than the previous poll, AND
        // 2. The timestamp is newer than what the user has actually seen
        const isNewMessage = lastMessageAt > previousLastMessageAt && lastMessageAt > lastSeenTimestamp;

        if (isNewMessage) {
          // Only track for cache updates if it's not the active conversation
          // (active conversation will update naturally when user views it)
          if (conversationId !== activeConversationId) {
            conversationsWithActualNewMessages.push(conversationId);

            // Increment unread count (no toast notification - user will see badge/indicator instead)
            incrementUnreadCount(conversationId);
          }
        }

        // Always update last seen timestamp to the latest message timestamp
        // This prevents re-notifying about the same message
        updateLastSeenMessageTimestamp(conversationId, lastMessageAt);
      }

      // Use setQueryData instead of invalidateQueries to silently update cache
      // This prevents cascade refetches while still updating the UI
      // Update cache silently - components will see new data on next render without refetching
      queryClient.setQueryData(queryKey, conversations);
      
      // Also update any conversation(clientId) queries by finding and updating them
      // This ensures all components see the updated data without triggering refetches
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      
      for (const query of allQueries) {
        const queryKeyArray = query.queryKey;
        // Check if this is a conversation query (starts with ["agent", "conversations"])
        if (
          Array.isArray(queryKeyArray) &&
          queryKeyArray.length >= 2 &&
          queryKeyArray[0] === "agent" &&
          queryKeyArray[1] === "conversations"
        ) {
          // Update this query's data silently
          queryClient.setQueryData(queryKeyArray, conversations);
        }
      }
      
      if (conversationsWithActualNewMessages.length > 0) {
        console.log("[useMessagePolling] Updated cache for conversations with new messages:", conversationsWithActualNewMessages);
      }

      // Update previous conversations ref
      previousConversationsRef.current = conversations;
      console.log("[useMessagePolling] Check complete", {
        conversationsCount: conversations.length,
        previousCount: previousConversationsRef.current.length,
        newMessagesCount: conversationsWithActualNewMessages.length,
      });
    } catch (error) {
      console.error("[useMessagePolling] Error checking for new messages:", error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [
    authReady,
    isAuthenticated,
    queryClient,
    incrementUnreadCount,
    updateLastSeenMessageTimestamp,
  ]);

  // Set up polling interval
  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      console.log("[useMessagePolling] Polling not started - auth not ready", {
        authReady,
        isAuthenticated,
      });
      return;
    }

    const startPolling = () => {
      // Clear existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const interval = getPollingInterval();
      const visibilityState = typeof document !== "undefined" ? document.visibilityState : "unknown";
      
      console.log("[useMessagePolling] Starting polling", {
        interval,
        isOnMessagingPage,
        visibilityState,
        pathname: location.pathname,
      });
      
      if (interval > 0) {
        // Initial check
        console.log("[useMessagePolling] Running initial check");
        checkForNewMessages();
        
        // Set up interval
        pollingIntervalRef.current = setInterval(() => {
          console.log("[useMessagePolling] Polling interval tick");
          checkForNewMessages();
        }, interval);
      } else {
        console.log("[useMessagePolling] Polling paused (interval is 0)");
      }
    };

    startPolling();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      const visibilityState = typeof document !== "undefined" ? document.visibilityState : "unknown";
      console.log("[useMessagePolling] Visibility changed", {
        visibilityState,
        willRestart: visibilityState === "visible",
      });
      startPolling();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityChangeHandlerRef.current = handleVisibilityChange;

    return () => {
      console.log("[useMessagePolling] Cleaning up polling");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (visibilityChangeHandlerRef.current) {
        document.removeEventListener(
          "visibilitychange",
          visibilityChangeHandlerRef.current
        );
        visibilityChangeHandlerRef.current = null;
      }
    };
  }, [
    authReady,
    isAuthenticated,
    isOnMessagingPage,
    checkForNewMessages,
  ]);
}

