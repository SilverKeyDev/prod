import { loadUnifiedMessagesListModule } from "packages/features/messaging/components/layout/messagesList/unifiedMessagesListDynamicImport";
import { LOG_CATEGORIES } from "packages/logger";
import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

import { loadAgentMessagingUIModule } from "@/features/agent/components/workspace/agentMessagingEntryLoad";

import { loadAgentDashboardModule, loadClientMessagingModule } from "./agentFeatureDynamicImports";

/**
 * Prewarm lazy chunks for /messaging (same modules as AgentFeature / AgentDashboard / AgentMessaging).
 * Loaders memoize import() so prefetch shares one Promise with React.lazy().
 *
 * - `all`: sidebar hover / unknown context — fetch client + agent branches in parallel.
 * - `client` | `agent`: when role is known (e.g. idle prefetch with user profile) — one fewer chunk.
 */
export type AgentMessagingPrefetchBranch = "all" | "agent" | "client";

export function prefetchAgentMessagingFeatureChunks(
  branch: AgentMessagingPrefetchBranch = "all"
): void {
  const cat = LOG_CATEGORIES.MESSAGES;
  traceDynamicImport(cat, "prefetch:UnifiedMessagesList", loadUnifiedMessagesListModule());
  if (branch === "all" || branch === "client") {
    traceDynamicImport(cat, "prefetch:ClientMessaging", loadClientMessagingModule());
  }
  if (branch === "all" || branch === "agent") {
    traceDynamicImport(cat, "prefetch:AgentDashboard", loadAgentDashboardModule());
    traceDynamicImport(cat, "prefetch:AgentMessagingUI", loadAgentMessagingUIModule());
  }
}
