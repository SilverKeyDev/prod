import { useCallback } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { prefetchLibraryRouteDataIfNeeded } from "packages/features/documents/hooks/data/libraryRouteDataPrefetch";
import { useAgentDashboardStore, useAuthStore } from "packages/store";

import { prefetchDashboardShellRoute } from "./dashboardRoutePrefetch";

/**
 * Chunk prefetch + React Query warm-up for routes that need it (e.g. Library `/library`).
 */
export function useDashboardShellRoutePrefetch(): (href: string) => void {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const selectedClientId = useAgentDashboardStore((s) => s.selectedClientId);

  const isAgent = (user?.roles ?? []).includes("agent");

  return useCallback(
    (href: string) => {
      prefetchDashboardShellRoute(href, { isAgent });
      prefetchLibraryRouteDataIfNeeded(queryClient, user, href, selectedClientId ?? undefined);
    },
    [queryClient, user, isAgent, selectedClientId]
  );
}
