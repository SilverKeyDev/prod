import { LOG_CATEGORIES } from "packages/logger";
import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

/**
 * Prewarm lazy chunks for /messaging (same modules as AgentFeature's React.lazy).
 * Use the same relative specifiers as AgentFeature so the bundler reuses one chunk per module.
 *
 * - `all`: sidebar hover / unknown context — fetch client + agent branches in parallel.
 * - `client` | `agent`: when role is known (e.g. idle prefetch with user profile) — one fewer chunk.
 */
export type AgentMessagingPrefetchBranch = "all" | "agent" | "client";

const unifiedMessagesListChunk = () =>
  import("packages/features/messaging/components/layout/UnifiedMessagesList");

export function prefetchAgentMessagingFeatureChunks(
  branch: AgentMessagingPrefetchBranch = "all"
): void {
  const cat = LOG_CATEGORIES.MESSAGES;
  // Lazy-loaded from ClientMessaging / AgentMessaging; prewarm with route so the list
  // does not extend a sequential chunk waterfall after the shell mounts.
  traceDynamicImport(cat, "prefetch:UnifiedMessagesList", unifiedMessagesListChunk());
  if (branch === "all" || branch === "client") {
    traceDynamicImport(cat, "prefetch:ClientMessaging", import("./messaging/ClientMessaging"));
  }
  if (branch === "all" || branch === "agent") {
    traceDynamicImport(cat, "prefetch:AgentDashboard", import("./workspace/AgentDashboard"));
  }
}
