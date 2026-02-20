import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import { useNavigation } from "packages/navigation";
import { BackgroundPolling } from "packages/services/data/backgroundPolling";
import { InitialDataLoader } from "packages/services/data/initialDataLoader";
import { useAuthStore } from "packages/store";

/**
 * Hook that initializes data loading and background polling on login
 * Should be called once at app level after authentication
 */
export function useDataInitialization() {
  const queryClient = useQueryClient();
  const { getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const dataLoaderRef = useRef<InitialDataLoader | null>(null);
  const pollingRef = useRef<BackgroundPolling | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once when user becomes authenticated
    // Note: location.pathname is NOT in deps to prevent re-initialization on route changes
    if (!authReady || !isAuthenticated || !user || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;

    // Initialize services
    if (!dataLoaderRef.current) {
      dataLoaderRef.current = new InitialDataLoader(queryClient);
    }
    if (!pollingRef.current) {
      pollingRef.current = new BackgroundPolling(queryClient);
    }

    // Prefetch all data (only once on initial mount)
    dataLoaderRef.current.prefetchAllData(user).catch((error) => {
      log.error(LOG_CATEGORIES.HOOKS, "Prefetch failed", error);
    });

    // Start background polling
    pollingRef.current.start(user, route.pathname);

    // Cleanup on unmount or logout
    return () => {
      pollingRef.current?.stop();
      hasInitializedRef.current = false;
    };
    // pathname intentionally omitted: init runs once; route changes are handled by the updatePathname effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see comment above
  }, [authReady, isAuthenticated, user, queryClient]);

  // Update polling pathname when route changes
  useEffect(() => {
    if (pollingRef.current && isAuthenticated) {
      pollingRef.current.updatePathname(route.pathname);
    }
  }, [route.pathname, isAuthenticated]);

  // Stop polling on logout
  useEffect(() => {
    if (!isAuthenticated && pollingRef.current) {
      pollingRef.current.stop();
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated]);
}
