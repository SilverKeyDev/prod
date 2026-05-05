import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { prefetchLibraryRouteDataIfNeeded } from "packages/hooks/data/polling/libraryRouteDataPrefetch";
import { useAuthStore } from "packages/store";

import { prefetchDashboardShellRoute } from "./dashboardRoutePrefetch";

/**
 * Chunk prefetch + React Query warm-up for routes that need it (e.g. Library `/saved`).
 */
export function useDashboardShellRoutePrefetch(): (href: string) => void {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useCallback(
    (href: string) => {
      prefetchDashboardShellRoute(href);
      prefetchLibraryRouteDataIfNeeded(queryClient, user, href);
    },
    [queryClient, user]
  );
}
