import type { QueryClient } from "@tanstack/react-query";

import type { AgentConversation } from "packages/config/http/api";
import { agentApi } from "packages/config/http/api";
import { queryKeys } from "packages/config/query/keys";
import { log, LOG_CATEGORIES } from "packages/logger";
import { dateParseISO } from "packages/utils/date";

export type NotificationStoreRef = {
  current: {
    activeConversationId: string | null;
    lastSeenMessageTimestamp: Record<string, number>;
  };
};

export type RunCheckForNewMessagesParams = {
  queryClient: QueryClient;
  notificationStoreRef: NotificationStoreRef;
  previousConversationsRef: { current: AgentConversation[] };
  isCheckingRef: { current: boolean };
  incrementUnreadCount: (conversationId: string) => void;
  updateLastSeenMessageTimestamp: (conversationId: string, timestamp: number) => void;
  authReady: boolean;
  isAuthenticated: boolean;
};

export async function runCheckForNewMessages(params: RunCheckForNewMessagesParams): Promise<void> {
  const {
    queryClient,
    notificationStoreRef,
    previousConversationsRef,
    isCheckingRef,
    incrementUnreadCount,
    updateLastSeenMessageTimestamp,
    authReady,
    isAuthenticated,
  } = params;

  if (!authReady || !isAuthenticated) return;
  if (isCheckingRef.current) return;

  isCheckingRef.current = true;

  try {
    const queryKey = queryKeys.agent.conversations();
    const result = await queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        const response = await agentApi.getChats();
        if (!response.success) {
          throw new Error(response.error ?? "Failed to fetch conversations");
        }
        return response.conversations ?? [];
      },
      staleTime: 0,
    });

    const conversations = (result as AgentConversation[]) ?? [];
    const previousConversations = previousConversationsRef.current;
    const storeState = notificationStoreRef.current;
    const activeConversationId = storeState.activeConversationId;
    const conversationsWithActualNewMessages: string[] = [];

    for (const conversation of conversations) {
      const conversationId = conversation.id;
      const lastMessageAt = conversation.last_message_at
        ? dateParseISO(conversation.last_message_at).valueOf()
        : 0;

      if (!lastMessageAt) continue;

      const previousConversation = previousConversations.find((c) => c.id === conversationId);
      const previousLastMessageAt = previousConversation?.last_message_at
        ? dateParseISO(previousConversation.last_message_at).valueOf()
        : 0;

      const lastSeenTimestamp = storeState.lastSeenMessageTimestamp[conversationId] ?? 0;
      const isNewMessage =
        lastMessageAt > previousLastMessageAt && lastMessageAt > lastSeenTimestamp;

      if (isNewMessage) {
        if (conversationId !== activeConversationId) {
          conversationsWithActualNewMessages.push(conversationId);
          incrementUnreadCount(conversationId);
        }
      }

      updateLastSeenMessageTimestamp(conversationId, lastMessageAt);
    }

    queryClient.setQueryData(queryKey, conversations);

    // Only invalidate client-specific conversation queries when the underlying
    // conversation list actually changed; otherwise every poll tick fires N
    // refetches and N rerender cascades for no reason.
    const conversationsChanged =
      previousConversations.length !== conversations.length ||
      conversations.some((conv) => {
        const prev = previousConversations.find((p) => p.id === conv.id);
        return (
          !prev ||
          prev.last_message_at !== conv.last_message_at ||
          prev.unread_count !== conv.unread_count
        );
      });
    if (conversationsChanged) {
      const queryCache = queryClient.getQueryCache();
      const allQueries = queryCache.getAll();
      for (const query of allQueries) {
        const k = query.queryKey;
        if (Array.isArray(k) && k.length > 2 && k[0] === "agent" && k[1] === "conversations") {
          void queryClient.invalidateQueries({ queryKey: k });
        }
      }
    }

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
}

export type SetupPollingEffectParams = {
  inRouter: boolean;
  authReady: boolean;
  isAuthenticated: boolean;
  pathname: string;
  isOnMessagingPage: boolean;
  getPollingInterval: () => number;
  checkForNewMessages: () => Promise<void>;
  pollingIntervalRef: { current: NodeJS.Timeout | null };
  visibilityChangeHandlerRef: { current: (() => void) | null };
  doc: Document | null;
};

export function setupPollingEffect(params: SetupPollingEffectParams): () => void {
  const {
    inRouter,
    authReady,
    isAuthenticated,
    pathname,
    isOnMessagingPage,
    getPollingInterval,
    checkForNewMessages,
    pollingIntervalRef,
    visibilityChangeHandlerRef,
    doc: docForVisibility,
  } = params;

  if (!inRouter) {
    log.debug(LOG_CATEGORIES.POLLING, "Polling not started - router context not available", {
      inRouter,
      pathname,
    });
    return () => {};
  }

  if (!authReady || !isAuthenticated) {
    log.debug(LOG_CATEGORIES.POLLING, "Polling not started - auth not ready", {
      authReady,
      isAuthenticated,
    });
    return () => {};
  }

  const startPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    const interval = getPollingInterval();
    const docForState = docForVisibility;
    const visibilityState = docForState?.visibilityState ?? "unknown";

    log.info(LOG_CATEGORIES.POLLING, "Starting polling", {
      interval,
      isOnMessagingPage,
      visibilityState,
      pathname,
      inRouter,
    });

    if (interval > 0) {
      log.debug(LOG_CATEGORIES.POLLING, "Running initial check");
      void checkForNewMessages();
      pollingIntervalRef.current = setInterval(() => {
        log.debug(LOG_CATEGORIES.POLLING, "Polling interval tick");
        void checkForNewMessages();
      }, interval);
    } else {
      log.debug(LOG_CATEGORIES.POLLING, "Polling paused (interval is 0)");
    }
  };

  void startPolling();

  const handleVisibilityChange = () => {
    const docForState = docForVisibility;
    const visibilityState = docForState?.visibilityState ?? "unknown";
    log.debug(LOG_CATEGORIES.POLLING, "Visibility changed", {
      visibilityState,
      willRestart: visibilityState === "visible",
    });
    startPolling();
  };

  if (docForVisibility) {
    docForVisibility.addEventListener("visibilitychange", handleVisibilityChange);
    visibilityChangeHandlerRef.current = handleVisibilityChange;
  }

  return () => {
    log.debug(LOG_CATEGORIES.POLLING, "Cleaning up polling");
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (visibilityChangeHandlerRef.current && docForVisibility) {
      docForVisibility.removeEventListener("visibilitychange", visibilityChangeHandlerRef.current);
      visibilityChangeHandlerRef.current = null;
    }
  };
}

export function setupSyncNotificationEffect(
  queryClient: QueryClient,
  setTotalUnreadCount: (count: number) => void
): () => void {
  const syncNotificationCounter = () => {
    const cachedCounter = queryClient.getQueryData<number>(queryKeys.agent.notificationCounter());
    if (
      cachedCounter !== undefined &&
      typeof cachedCounter === "number" &&
      !isNaN(cachedCounter) &&
      cachedCounter >= 0
    ) {
      setTotalUnreadCount(cachedCounter);
    }
  };

  syncNotificationCounter();

  // The query cache subscription below already pushes updates as soon as
  // notification-counter changes, so we don't need a 2s wall-clock setInterval
  // calling setTotalUnreadCount unconditionally — that was firing every 2s and
  // (combined with non-idempotent store setters) causing every notification
  // subscriber to re-render on a 2s cadence.
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (
      event?.type === "updated" &&
      Array.isArray(event.query.queryKey) &&
      event.query.queryKey[0] === "agent" &&
      event.query.queryKey[1] === "notification-counter"
    ) {
      const data = event.query.state.data as number | undefined;
      if (data !== undefined && typeof data === "number" && !isNaN(data) && data >= 0) {
        setTotalUnreadCount(data);
      }
    }
  });

  return () => {
    unsubscribe();
  };
}
