import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../../store/auth.slice";
import { InitialDataLoader } from "../../services/data/initialDataLoader";
import { BackgroundPolling } from "../../services/data/backgroundPolling";
import { log, LOG_CATEGORIES } from "../../../logger";

/**
 * Hook that initializes data loading and background polling on login
 * Should be called once at app level after authentication
 */
export function useDataInitialization() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const dataLoaderRef = useRef<InitialDataLoader | null>(null);
  const pollingRef = useRef<BackgroundPolling | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once when user becomes authenticated
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

    // Prefetch all data
    dataLoaderRef.current.prefetchAllData(user).catch((error) => {
      log.error(LOG_CATEGORIES.HOOKS, "Prefetch failed", error);
    });

    // Start background polling
    pollingRef.current.start(user, location.pathname);

    // Cleanup on unmount or logout
    return () => {
      pollingRef.current?.stop();
      hasInitializedRef.current = false;
    };
  }, [authReady, isAuthenticated, user, queryClient, location.pathname]);

  // Update polling pathname when route changes
  useEffect(() => {
    if (pollingRef.current && isAuthenticated) {
      pollingRef.current.updatePathname(location.pathname);
    }
  }, [location.pathname, isAuthenticated]);

  // Stop polling on logout
  useEffect(() => {
    if (!isAuthenticated && pollingRef.current) {
      pollingRef.current.stop();
      hasInitializedRef.current = false;
    }
  }, [isAuthenticated]);
}
