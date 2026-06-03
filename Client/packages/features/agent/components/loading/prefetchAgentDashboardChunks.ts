import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

import { loadClientHubModule, loadClientListModule } from "./agentDashboardDynamicImports";

/**
 * Prewarm lazy chunks for agent `/dashboard` surfaces (ClientList + ClientHub).
 * Loaders memoize import() so prefetch shares one Promise with React.lazy().
 */
export type AgentDashboardPrefetchBranch = "all" | "agent" | "client";

export function prefetchAgentDashboardChunks(branch: AgentDashboardPrefetchBranch = "all"): void {
  if (branch === "all" || branch === "agent") {
    const cat = "DASHBOARD";
    traceDynamicImport(cat, "prefetch:ClientList", loadClientListModule());
    traceDynamicImport(cat, "prefetch:ClientHub", loadClientHubModule());
  }
}
