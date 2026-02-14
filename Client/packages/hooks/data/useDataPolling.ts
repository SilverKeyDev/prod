import { useEffect, useRef, useCallback } from "react";
import { useLocation, useInRouterContext } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../config/query/keys";
import { useNotificationStore } from "../../store/notifications.slice";
import type { AgentConversation } from "../../config/api";
import { useAuthStore } from "../../store/auth.slice";
import { agentApi } from "../../config/api";
import { log, LOG_CATEGORIES } from "../../../logger";

// Polling intervals in milliseconds
const POLLING_INTERVALS = {
  ACTIVE_PAGE: 8000, // 8 seconds when on messaging page
  OTHER_PAGE: 45000, // 45 seconds when elsewhere
  HIDDEN: 0, // Pause when tab is hidden
} as const;

/**
 * Hook that polls for data updates (including messages) with adaptive intervals based on:
 * - Current route (frequent on /messaging, less frequent elsewhere)
 * - Page visibility (pauses when tab is hidden)
 */
export function useDataPolling() {
  // Check if we're inside Router context
  // In production builds with code splitting, Router context might not be immediately available
  // during initial render/hydration, but useLocation() should still work if we're in a Route
  const inRouter = useInRouterContext();

  // Always call useLocation() unconditionally (Rules of Hooks)
  // Since StoreIntegrationsLayout is inside a <Route>, Router context should be available
  // If it's not, this indicates a timing issue in production that we'll handle gracefully
  // In React Router v7, useLocation() may work even outside router context, but we check
  // useInRouterContext() to ensure we're actually in a router before starting polling
  const location = useLocation();

  // Use window.location as fallback if router context isn't available yet
  // This ensures we have a valid pathname even during initial render/hydration
  const pathname = inRouter
    ? location.pathname
    : typeof window !== "undefined"
      ? window.location.pathname
      : "/";

  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Use selectors to get store actions - these are stable references
  // IMPORTANT: All hooks must be called unconditionally to maintain hook order
  const incrementUnreadCount = useNotificationStore(
    (s) => s.incrementUnreadCount,
  );
  const updateLastSeenMessageTimestamp = useNotificationStore(
    (s) => s.updateLastSeenMessageTimestamp,
  );
  const setTotalUnreadCount = useNotificationStore(
    (s) => s.setTotalUnreadCount,
  );

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

  // If Router context isn't available, log a warning but don't crash
  // This can happen during initial render in production with code splitting
  // The component will re-render once Router context is available
  useEffect(() => {
    if (
      !inRouter &&
      typeof window !== "undefined" &&
      document.readyState === "complete"
    ) {
      // Only log if page is fully loaded (not during hydration)
      // This is a timing issue that should resolve on the next render
      log.warn(
        LOG_CATEGORIES.POLLING,
        "Router context check failed, but location is available",
        {
          href: window.location.href,
          hasLocation: !!location,
          timestamp: new Date().toISOString(),
        },
      );
    }
  }, [inRouter, location]);

  // Check if we're on the messaging page
  const isOnMessagingPage = pathname.startsWith("/messaging");

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

  // Check for new data updates (including messages) and update notifications
  const checkForNewMessages = useCallback(async () => {
    if (!authReady || !isAuthenticated) {
      return;
    }

    // Prevent concurrent checks
    if (isCheckingRef.current) {
      return;
    }

    isCheckingRef.current = true;

    try {
      // Always fetch fresh data for polling to get latest message timestamps
      const queryKey = queryKeys.agent.conversations();

      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: async () => {
          const response = await agentApi.getChats(); // Fetch all conversations for polling
          if (!response.success) {
            throw new Error(response.error ?? "Failed to fetch conversations");
          }
          return response.conversations ?? [];
        },
        staleTime: 0, // Force fresh fetch
      });

      const conversations = (result as AgentConversation[]) ?? [];

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
          (c) => c.id === conversationId,
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
        const isNewMessage =
          lastMessageAt > previousLastMessageAt &&
          lastMessageAt > lastSeenTimestamp;

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

      // Update previous conversations ref
      previousConversationsRef.current = conversations;
      log.debug(LOG_CATEGORIES.POLLING, "Check complete", {
        conversationsCount: conversations.length,
        previousCount: previousConversationsRef.current.length,
        newMessagesCount: conversationsWithActualNewMessages.length,
      });
    } catch (error) {
      log.error(LOG_CATEGORIES.ERRORS, "Error checking for new data", error);
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
    // Don't start polling if router context isn't available yet
    // This prevents errors in production where router chunk might load after this code
    if (!inRouter) {
      log.debug(
        LOG_CATEGORIES.POLLING,
        "Polling not started - router context not available",
        {
          inRouter,
          pathname: location.pathname,
        },
      );
      return;
    }

    if (!authReady || !isAuthenticated) {
      log.debug(
        LOG_CATEGORIES.POLLING,
        "Polling not started - auth not ready",
        {
          authReady,
          isAuthenticated,
        },
      );
      return;
    }

    const startPolling = () => {
      // Clear existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }

      const interval = getPollingInterval();
      const visibilityState =
        typeof document !== "undefined" ? document.visibilityState : "unknown";

      log.info(LOG_CATEGORIES.POLLING, "Starting polling", {
        interval,
        isOnMessagingPage,
        visibilityState,
        pathname,
        inRouter,
      });

      if (interval > 0) {
        // Initial check
        log.debug(LOG_CATEGORIES.POLLING, "Running initial check");
        checkForNewMessages();

        // Set up interval
        pollingIntervalRef.current = setInterval(() => {
          log.debug(LOG_CATEGORIES.POLLING, "Polling interval tick");
          checkForNewMessages();
        }, interval);
      } else {
        log.debug(LOG_CATEGORIES.POLLING, "Polling paused (interval is 0)");
      }
    };

    startPolling();

    // Handle visibility changes
    const handleVisibilityChange = () => {
      const visibilityState =
        typeof document !== "undefined" ? document.visibilityState : "unknown";
      log.debug(LOG_CATEGORIES.POLLING, "Visibility changed", {
        visibilityState,
        willRestart: visibilityState === "visible",
      });
      startPolling();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityChangeHandlerRef.current = handleVisibilityChange;

    return () => {
      log.debug(LOG_CATEGORIES.POLLING, "Cleaning up polling");
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (visibilityChangeHandlerRef.current) {
        document.removeEventListener(
          "visibilitychange",
          visibilityChangeHandlerRef.current,
        );
        visibilityChangeHandlerRef.current = null;
      }
    };
  }, [
    authReady,
    isAuthenticated,
    isOnMessagingPage,
    checkForNewMessages,
    inRouter, // Re-run effect when router context becomes available
    location.pathname, // Re-run when location changes
  ]);

  // Sync notification counter from React Query cache to store
  // This ensures the sidebar badge always shows the correct count
  // Background polling fetches it every 10 seconds, we just sync to store
  useEffect(() => {
    if (!authReady || !isAuthenticated) {
      return;
    }

    const syncNotificationCounter = () => {
      const cachedCounter = queryClient.getQueryData<number>(
        queryKeys.agent.notificationCounter(),
      );
      // Only set if valid number >= 0, otherwise don't update (defaults to 0)
      if (
        cachedCounter !== undefined &&
        typeof cachedCounter === "number" &&
        !isNaN(cachedCounter) &&
        cachedCounter >= 0
      ) {
        setTotalUnreadCount(cachedCounter);
      }
    };

    // Check immediately
    syncNotificationCounter();

    // Subscribe to React Query cache changes for notification counter
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event?.type === "updated" &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === "agent" &&
        event.query.queryKey[1] === "notification-counter"
      ) {
        const data = event.query.state.data as number | undefined;
        // Only set if valid number >= 0, otherwise don't update (defaults to 0)
        if (
          data !== undefined &&
          typeof data === "number" &&
          !isNaN(data) &&
          data >= 0
        ) {
          setTotalUnreadCount(data);
        }
      }
    });

    // Also check periodically in case subscription misses updates
    const intervalId = setInterval(syncNotificationCounter, 2000); // Check every 2 seconds

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [authReady, isAuthenticated, queryClient, setTotalUnreadCount]);
}
