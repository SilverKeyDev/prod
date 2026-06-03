import { useCallback, useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import type { AgentConversation } from "packages/config/http/api";
import { log } from "packages/logger";
import { useInRouterContext, useNavigation } from "packages/navigation";
import { useNotificationStore } from "packages/store";
import { useAuthStore } from "packages/store";
import { dateNow } from "packages/utils/date";
import { getDocument, getWindow } from "packages/utils/platform";

import {
  runCheckForNewMessages,
  setupPollingEffect,
  setupSyncNotificationEffect,
} from "./useDataPollingHelpers";

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

  const { getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();

  // Use window.location as fallback if router context isn't available yet
  // This ensures we have a valid pathname even during initial render/hydration
  const winForPath = getWindow();
  const pathname = inRouter ? route.pathname : winForPath ? winForPath.location.pathname : "/";

  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  // Use selectors to get store actions - these are stable references
  // IMPORTANT: All hooks must be called unconditionally to maintain hook order
  const incrementUnreadCount = useNotificationStore((s) => s.incrementUnreadCount);
  const updateLastSeenMessageTimestamp = useNotificationStore(
    (s) => s.updateLastSeenMessageTimestamp
  );
  const setTotalUnreadCount = useNotificationStore((s) => s.setTotalUnreadCount);

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
    const windowRef = getWindow();
    const doc = getDocument();
    if (!inRouter && windowRef && doc?.readyState === "complete") {
      // Only log if page is fully loaded (not during hydration)
      // This is a timing issue that should resolve on the next render
      log.warn("POLLING", "Router context check failed, but location is available", {
        href: windowRef.location.href,
        hasLocation: !!location,
        timestamp: dateNow().toISOString(),
      });
    }
    // location is from useLocation(); effect only logs when inRouter is false
  }, [inRouter]);

  // Check if we're on the messaging page
  const isOnMessagingPage = pathname.startsWith("/messaging");

  // Determine polling interval based on route and visibility (memoized for stable effect deps)
  const getPollingInterval = useCallback((): number => {
    const doc = getDocument();
    if (!doc) return POLLING_INTERVALS.OTHER_PAGE;

    if (doc.visibilityState === "hidden") {
      return POLLING_INTERVALS.HIDDEN;
    }

    return isOnMessagingPage ? POLLING_INTERVALS.ACTIVE_PAGE : POLLING_INTERVALS.OTHER_PAGE;
  }, [isOnMessagingPage]);

  const checkForNewMessages = useCallback(async () => {
    await runCheckForNewMessages({
      queryClient,
      notificationStoreRef,
      previousConversationsRef,
      isCheckingRef,
      incrementUnreadCount,
      updateLastSeenMessageTimestamp,
      authReady,
      isAuthenticated,
    });
  }, [
    authReady,
    isAuthenticated,
    queryClient,
    incrementUnreadCount,
    updateLastSeenMessageTimestamp,
  ]);

  useEffect(() => {
    const docForVisibility = getDocument();
    return setupPollingEffect({
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
    });
  }, [
    authReady,
    isAuthenticated,
    isOnMessagingPage,
    checkForNewMessages,
    getPollingInterval,
    pathname,
    inRouter,
  ]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    return setupSyncNotificationEffect(queryClient, setTotalUnreadCount);
  }, [authReady, isAuthenticated, queryClient, setTotalUnreadCount]);
}
