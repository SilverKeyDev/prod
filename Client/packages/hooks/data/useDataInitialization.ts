import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { log, LOG_CATEGORIES } from "packages/logger";
import { ROUTES, useNavigation } from "packages/navigation";
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
    // New accounts land on onboarding first; do not prefetch or start polling until they leave it.
    if (!authReady || !isAuthenticated || !user || hasInitializedRef.current) {
      return;
    }
    if (route.pathname === ROUTES.ONBOARDING) {
      return;
    }

    hasInitializedRef.current = true;

    if (!dataLoaderRef.current) {
      dataLoaderRef.current = new InitialDataLoader(queryClient);
    }
    if (!pollingRef.current) {
      pollingRef.current = new BackgroundPolling(queryClient);
    }

    dataLoaderRef.current.prefetchAllData(user).catch((error) => {
      log.error(LOG_CATEGORIES.HOOKS, "Prefetch failed", error);
    });

    pollingRef.current.start(user, route.pathname);
  }, [authReady, isAuthenticated, user, queryClient, route.pathname]);

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
