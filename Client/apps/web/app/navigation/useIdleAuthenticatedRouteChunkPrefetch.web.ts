import { useCallback } from "react";

import { prefetchAgentMessagingFeatureChunks } from "packages/features/agent/components/loading/prefetchAgentMessagingChunks";
import { useIdleAuthenticatedRouteChunkPrefetchCore } from "packages/hooks/navigation/useIdleAuthenticatedRouteChunkPrefetchCore.web";
import { traceDynamicImport } from "packages/utils/core/perf/shellRouteLoadTiming";

import { prefetchDashboardShellRoute } from "./dashboardShellRoutePrefetch.web";

export function useIdleAuthenticatedRouteChunkPrefetch(pathname: string): void {
  const prefetchMessagingColdPath = useCallback((isAgent: boolean) => {
    traceDynamicImport("MESSAGES", "idlePrefetch:AgentPage", import("@/pages/workspace/AgentPage"));
    prefetchAgentMessagingFeatureChunks(isAgent ? "agent" : "client");
  }, []);

  useIdleAuthenticatedRouteChunkPrefetchCore(pathname, prefetchDashboardShellRoute, {
    prefetchMessagingColdPath,
  });
}
