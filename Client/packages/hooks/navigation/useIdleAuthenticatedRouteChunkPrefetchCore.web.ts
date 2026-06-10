import { useEffect, useRef } from "react";

import { log } from "packages/logger";
import { ROUTES } from "packages/navigation";
import { useAuthStore } from "packages/store";
import { getWindow } from "packages/utils/core/platform";

import type { PrefetchDashboardShellRouteFn } from "./dashboardShellRoutePrefetch.types";

export type IdleAuthenticatedRouteChunkPrefetchOptions = {
  /** Prewarm messaging route + feature chunks when user lands cold on /messaging. */
  prefetchMessagingColdPath?: (isAgent: boolean) => void;
};

/**
 * After login, prefetch dashboard + messaging lazy chunks soon after the first
 * paint so cold navigation avoids extra JS latency.
 */
export function useIdleAuthenticatedRouteChunkPrefetchCore(
  pathname: string,
  prefetchShellRoute: PrefetchDashboardShellRouteFn,
  options?: IdleAuthenticatedRouteChunkPrefetchOptions
): void {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const prefetchMessagingColdPath = options?.prefetchMessagingColdPath;
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
      if (!pathname.startsWith("/dashboard")) {
        prefetchShellRoute("/dashboard", shellOpts);
      }
      if (!pathname.startsWith("/messaging")) {
        prefetchShellRoute("/messaging", shellOpts);
      } else {
        prefetchMessagingColdPath?.((user.roles ?? []).includes("agent"));
      }
    };

    let raf1 = 0;
    let raf2 = 0;
    const win = getWindow();
    if (!win) {
      return;
    }
    raf1 = win.requestAnimationFrame(() => {
      raf2 = win.requestAnimationFrame(() => {
        if (!cancelled) {
          run();
        }
      });
    });

    return () => {
      cancelled = true;
      win.cancelAnimationFrame(raf1);
      win.cancelAnimationFrame(raf2);
    };
  }, [authReady, isAuthenticated, user, pathname, prefetchShellRoute, prefetchMessagingColdPath]);
}
