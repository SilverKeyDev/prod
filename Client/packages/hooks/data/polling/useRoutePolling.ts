import { useCallback, useEffect, useRef } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { log } from "packages/logger";
import { useNavigation } from "packages/navigation";
import type { RouteConfig } from "packages/services/data/dataConfig";
import { getPollingRoutes } from "packages/services/data/dataConfig";
import { useAuthStore } from "packages/store";
import type { UserProfile } from "packages/types";
import { getDocument } from "packages/utils/core/platform";

/**
 * Polling intervals in milliseconds
 */
const POLLING_INTERVALS = {
  // Paused when tab is hidden
  HIDDEN: 0,
} as const;

/**
 * Hook that manages background polling for routes
 * Should be called once at app level after authentication
 */
export function useRoutePolling() {
  const queryClient = useQueryClient();
  const { getCurrentRoute } = useNavigation();
  const route = getCurrentRoute();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isPollingRef = useRef(false);
  const currentPathnameRef = useRef("/");
  const currentUserRef = useRef<UserProfile | null>(null);

  // ============================================
  // Polling Helpers
  // ============================================

  const isRouteActivePage = useCallback((routeConfig: RouteConfig): boolean => {
    const isMessaging = currentPathnameRef.current.startsWith("/messaging");
    if (routeConfig.key === "conversations") return isMessaging;
    if (routeConfig.key === "agentClients") return isMessaging;
    if (routeConfig.key === "connectionRequests") return isMessaging;
    return false;
  }, []);

  const getPollingInterval = useCallback((baseInterval: number): number => {
    const doc = getDocument();
    if (!doc) return baseInterval;
    if (doc.visibilityState === "hidden") {
      return POLLING_INTERVALS.HIDDEN;
    }
    return baseInterval;
  }, []);

  const startRoutePolling = useCallback(
    (routeConfig: RouteConfig): void => {
      const poll = async () => {
        if (!currentUserRef.current) return;

        if (
          routeConfig.userType === "agent" &&
          !(currentUserRef.current.roles ?? []).includes("agent")
        ) {
          return;
        }

        const isOnActivePage = isRouteActivePage(routeConfig);
        /** On `/messaging`, conversation updates are driven by SSE; keep REST polling on the idle cadence only. */
        const baseInterval =
          routeConfig.key === "conversations" && isOnActivePage
            ? (routeConfig.pollingInterval ?? 45000)
            : isOnActivePage && routeConfig.pollingIntervalActive
              ? routeConfig.pollingIntervalActive
              : (routeConfig.pollingInterval ?? 0);

        const interval = getPollingInterval(baseInterval);
        if (interval === 0) return;

        try {
          await queryClient.fetchQuery({
            queryKey: routeConfig.queryKey(),
            queryFn: () => routeConfig.queryFn(currentUserRef.current),
            staleTime: 0,
          });
        } catch (error) {
          log.error("POLLING", `❌ ${routeConfig.key} poll failed`, error);
        }
      };

      void poll();

      const isOnActivePage = isRouteActivePage(routeConfig);
      const intervalMs =
        routeConfig.key === "conversations" && isOnActivePage
          ? (routeConfig.pollingInterval ?? 45000)
          : isOnActivePage && routeConfig.pollingIntervalActive
            ? routeConfig.pollingIntervalActive
            : (routeConfig.pollingInterval ?? 0);

      if (intervalMs > 0) {
        const intervalId = setInterval(poll, intervalMs);
        intervalsRef.current.set(routeConfig.key, intervalId);
      }
    },
    [queryClient, isRouteActivePage, getPollingInterval]
  );

  const stopRoutePolling = useCallback((key: string): void => {
    const interval = intervalsRef.current.get(key);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(key);
    }
  }, []);

  const startPolling = useCallback(
    (userProfile: UserProfile | null, pathname: string): void => {
      if (isPollingRef.current) {
        log.info("POLLING", "Already polling, skipping start");
        return;
      }

      currentUserRef.current = userProfile;
      currentPathnameRef.current = pathname;
      isPollingRef.current = true;

      const routes = getPollingRoutes(userProfile);

      log.info("POLLING", "🚀 Starting background polling", {
        userId: userProfile?.id,
        isAgent: (userProfile?.roles ?? []).includes("agent"),
        pathname,
        routeCount: routes.length,
      });

      routes.forEach((routeConfig) => {
        startRoutePolling(routeConfig);
      });
    },
    [startRoutePolling]
  );

  const stopPolling = useCallback((): void => {
    if (!isPollingRef.current) {
      return;
    }

    intervalsRef.current.forEach((interval) => clearInterval(interval));
    intervalsRef.current.clear();
    isPollingRef.current = false;
  }, []);

  // ============================================
  // Start Polling on Authentication
  // ============================================

  useEffect(() => {
    if (!authReady || !isAuthenticated || !user) {
      return;
    }

    currentUserRef.current = user;
    currentPathnameRef.current = route.pathname;

    // Start background polling
    startPolling(user, route.pathname);
  }, [authReady, isAuthenticated, user, route.pathname, startPolling]);

  // ============================================
  // Visibility Change Listener
  // ============================================

  useEffect(() => {
    const doc = getDocument();
    if (!doc) return;

    const handleVisibilityChange = () => {
      if (!isPollingRef.current) return;

      const isHidden = doc.visibilityState === "hidden";

      if (isHidden) {
        intervalsRef.current.forEach((interval) => clearInterval(interval));
        intervalsRef.current.clear();
      } else {
        if (currentUserRef.current) {
          startPolling(currentUserRef.current, currentPathnameRef.current);
        }
      }
    };

    doc.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      doc.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [startPolling]);

  // ============================================
  // Update Polling Pathname
  // ============================================

  useEffect(() => {
    if (isPollingRef.current && isAuthenticated && currentUserRef.current) {
      currentPathnameRef.current = route.pathname;

      const routes = getPollingRoutes(currentUserRef.current);
      routes.forEach((routeConfig) => {
        if (routeConfig.pollingIntervalActive) {
          stopRoutePolling(routeConfig.key);
          startRoutePolling(routeConfig);
        }
      });
    }
  }, [route.pathname, isAuthenticated, stopRoutePolling, startRoutePolling]);

  // ============================================
  // Stop Polling on Logout
  // ============================================

  useEffect(() => {
    if (!isAuthenticated && isPollingRef.current) {
      stopPolling();
    }
  }, [isAuthenticated, stopPolling]);
}
