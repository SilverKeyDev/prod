import { useEffect, useRef } from "react";

import { prefetchAgentMessagingFeatureChunks } from "packages/features/agent/components/loading/prefetchAgentMessagingChunks";
import { log } from "packages/logger";
import { ROUTES } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

import { prefetchDashboardShellRoute } from "@/app/layouts/dashboard/dashboardRoutePrefetch";

/**
 * After login, prefetch dashboard + messaging lazy chunks soon after the first
 * paint so cold navigation (bookmark, tap without prior hover) avoids extra JS
 * latency. Uses double rAF (not idle-only) so work starts predictably after
 * initial paint instead of waiting for an idle slice or a long rIC timeout.
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
      log.info("ROUTING", "[PERF] Authenticated heavy route chunk prefetch batch starting", {
        pathname,
      });
      const shellOpts = { isAgent: (user.roles ?? []).includes("agent") };
      // Prewarm both heavy chunks; skip the one we're already on.
      if (!pathname.startsWith("/dashboard")) {
        prefetchDashboardShellRoute("/dashboard", shellOpts);
      }
      if (!pathname.startsWith("/messaging")) {
        prefetchDashboardShellRoute("/messaging", shellOpts);
      } else {
        // Cold load or refresh on /messaging: outer route prefetch is skipped above; still
        // prewarm AgentPage + the correct AgentFeature lazy branch in parallel with other work.
        traceDynamicImport(
          "MESSAGES",
          "idlePrefetch:AgentPage",
          import("@/pages/workspace/AgentPage")
        );
        const branch = (user.roles ?? []).includes("agent") ? "agent" : "client";
        prefetchAgentMessagingFeatureChunks(branch);
      }
    };

    let raf1 = 0;
    let raf2 = 0;
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (!cancelled) {
          run();
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [authReady, isAuthenticated, user, pathname]);
}
