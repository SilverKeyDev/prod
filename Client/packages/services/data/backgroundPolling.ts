import { QueryClient } from "@tanstack/react-query";
import { log, LOG_CATEGORIES } from "logger";

import type { UserProfile } from "packages/schemas";
import { getDocument } from "packages/utils/core/platform";

import { DATA_ROUTES, getPollingRoutes } from "./dataConfig";

/**
 * Polling intervals in milliseconds
 */
const POLLING_INTERVALS = {
  // Paused when tab is hidden
  HIDDEN: 0,
} as const;

/**
 * Background polling service - polls endpoints at different intervals
 * Automatically adjusts based on page visibility and user type
 */
export class BackgroundPolling {
  private queryClient: QueryClient;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isPolling = false;
  private currentPathname = "/";
  private user: UserProfile | null = null;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupVisibilityListener();
  }

  /**
   * Start polling for authenticated user
   */
  start(user: UserProfile | null, pathname: string = "/"): void {
    if (this.isPolling) {
      log.info(LOG_CATEGORIES.POLLING, "Already polling, skipping start");
      return;
    }

    this.user = user;
    this.currentPathname = pathname;
    this.isPolling = true;

    const routes = getPollingRoutes(user);

    log.info(LOG_CATEGORIES.POLLING, "🚀 Starting background polling", {
      userId: user?.id,
      isAgent: user?.is_agent ?? false,
      pathname,
      routeCount: routes.length,
    });

    // Start polling for all configured routes
    routes.forEach((route) => {
      this.startRoutePolling(route);
    });
  }

  /**
   * Stop all polling
   */
  stop(): void {
    if (!this.isPolling) {
      return;
    }

    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
    this.isPolling = false;
  }

  /**
   * Update current pathname (for adaptive polling)
   */
  updatePathname(pathname: string): void {
    this.currentPathname = pathname;

    // Restart polling for routes that have adaptive intervals
    if (this.isPolling && this.user) {
      const routes = getPollingRoutes(this.user);
      routes.forEach((route) => {
        // Only restart routes that have adaptive intervals
        if (route.pollingIntervalActive) {
          this.stopPolling(route.key);
          this.startRoutePolling(route);
        }
      });
    }
  }

  // ============================================
  // Individual Polling Methods
  // ============================================

  /**
   * Start polling for a single route using its configuration
   */
  private startRoutePolling(
    route: (typeof DATA_ROUTES)[keyof typeof DATA_ROUTES],
  ): void {
    const poll = async () => {
      if (!this.user) return;

      // Check if route should be polled based on user type
      if (route.userType === "agent" && !this.user.is_agent) {
        return;
      }

      // Determine polling interval (adaptive if route supports it)
      const isOnActivePage = this.isRouteActivePage(route);
      const baseInterval =
        isOnActivePage && route.pollingIntervalActive
          ? route.pollingIntervalActive
          : (route.pollingInterval ?? 0);

      const interval = this.getPollingInterval(baseInterval);
      if (interval === 0) return;

      try {
        await this.queryClient.fetchQuery({
          queryKey: route.queryKey(),
          queryFn: () => route.queryFn(this.user),
          staleTime: 0, // Always fetch fresh when polling
        });
      } catch (error) {
        log.error(LOG_CATEGORIES.POLLING, `❌ ${route.key} poll failed`, error);
      }
    };

    // Initial poll
    void poll();

    // Determine interval for setInterval
    const isOnActivePage = this.isRouteActivePage(route);
    const intervalMs =
      isOnActivePage && route.pollingIntervalActive
        ? route.pollingIntervalActive
        : (route.pollingInterval ?? 0);

    if (intervalMs > 0) {
      const intervalId = setInterval(poll, intervalMs);
      this.intervals.set(route.key, intervalId);
    }
  }

  /**
   * Check if the current pathname indicates we're on the active page for this route
   */
  private isRouteActivePage(
    route: (typeof DATA_ROUTES)[keyof typeof DATA_ROUTES],
  ): boolean {
    // Conversations have adaptive polling when on messaging page
    if (route.key === "conversations") {
      return this.currentPathname.startsWith("/messaging");
    }
    // Add other route-specific active page checks here if needed
    return false;
  }

  private stopPolling(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  private getPollingInterval(baseInterval: number): number {
    const doc = getDocument();
    if (!doc) return baseInterval;
    if (doc.visibilityState === "hidden") {
      return POLLING_INTERVALS.HIDDEN;
    }
    return baseInterval;
  }

  private setupVisibilityListener(): void {
    const doc = getDocument();
    if (!doc) return;

    doc.addEventListener("visibilitychange", () => {
      if (!this.isPolling) return;

      const isHidden = doc.visibilityState === "hidden";

      if (isHidden) {
        // Pause all polling
        this.intervals.forEach((interval) => clearInterval(interval));
        this.intervals.clear();
      } else {
        // Resume polling
        this.start(this.user, this.currentPathname);
      }
    });
  }
}
