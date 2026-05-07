import { useEffect, useRef } from "react";

import { prefetchAgentMessagingFeatureChunks } from "packages/features/agent/components/prefetchAgentMessagingChunks";
import { log, LOG_CATEGORIES } from "packages/logger";
import { ROUTES } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

import { prefetchDashboardShellRoute } from "@/app/layouts/dashboard/dashboardRoutePrefetch";

declare global {
  interface Window {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
    cancelIdleCallback?: (handle: number) => void;
  }
}

/**
 * After login, prefetch the dashboard + messaging lazy chunks during idle time
 * so cold navigation (bookmark, tap without prior hover) avoids extra JS
 * latency. These two routes pull the heaviest feature trees (calendar,
 * messaging) and are noticeably slower than search/profile/library otherwise.
 * Runs once per authenticated session; ref resets on logout.
 */
export function useIdleAuthenticatedRouteChunkPrefetch(pathname: string): void {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const didPrefetchRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      didPrefetchRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !user) {
      return;
    }
    if (pathname === ROUTES.ONBOARDING) {
      return;
    }
    if (didPrefetchRef.current) {
      return;
    }

    let cancelled = false;

    const run = () => {
      if (cancelled || didPrefetchRef.current) {
        return;
      }
      didPrefetchRef.current = true;
      log.info(LOG_CATEGORIES.ROUTING, "[PERF] Idle authenticated route chunk prefetch batch starting", {
        pathname,
      });
      // Prewarm both heavy chunks; skip the one we're already on.
      if (!pathname.startsWith("/dashboard")) {
        prefetchDashboardShellRoute("/dashboard");
      }
      if (!pathname.startsWith("/messaging")) {
        prefetchDashboardShellRoute("/messaging");
      } else {
        // Cold load or refresh on /messaging: outer route prefetch is skipped above; still
        // prewarm AgentPage + the correct AgentFeature lazy branch in parallel with other work.
        traceDynamicImport(LOG_CATEGORIES.MESSAGES, "idlePrefetch:AgentPage", import("@/pages/workspace/AgentPage"));
        const branch = user.is_agent === true ? "agent" : "client";
        prefetchAgentMessagingFeatureChunks(branch);
      }
    };

    let idleHandle: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(run, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(run, 2000);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== undefined && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [authReady, isAuthenticated, user, pathname]);
}
