import { useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { log } from "packages/logger";
import { ROUTES, useNavigation } from "packages/navigation";
import { useAuthStore } from "packages/store";

import { prefetchAllInitialData } from "./usePrefetchHelpers";

/**
 * Hook that prefetches all initial data on login
 * Should be called once at app level after authentication
 */
export function usePrefetch() {
  const queryClient = useQueryClient();
  const { getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // New accounts land on onboarding first; do not prefetch until they leave it.
    if (!authReady || !isAuthenticated || !user || hasInitializedRef.current) {
      return;
    }
    if (route.pathname === ROUTES.ONBOARDING) {
      return;
    }

    hasInitializedRef.current = true;

    // Prefetch all initial data
    prefetchAllInitialData({ user, queryClient }).catch((error) => {
      log.error("HOOKS", "Prefetch failed", error);
    });
  }, [authReady, isAuthenticated, user, route.pathname, queryClient]);

  // Reset initialization flag on logout
  useEffect(() => {
    if (!isAuthenticated && hasInitializedRef.current) {
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated]);
}
