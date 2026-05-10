import { prefetchAgentMessagingFeatureChunks } from "packages/features/agent/components/prefetchAgentMessagingChunks";
import { LOG_CATEGORIES } from "packages/logger";
import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

/**
 * Best-effort prefetch for dashboard-shell lazy chunks (hover / focus / touch intent).
 * Repeated calls are harmless; the dynamic import promise is deduped by the runtime.
 */
export function prefetchDashboardShellRoute(href: string): void {
  const raw = (href.split("?")[0] ?? "").split("#")[0] ?? "";
  const path = raw.startsWith("/") ? raw : `/${raw}`;

  if (path.startsWith("/search")) {
    traceDynamicImport(
      LOG_CATEGORIES.ROUTING,
      "prefetch:SearchPage",
      import("@/pages/property/SearchPage")
    );
    if (typeof window !== "undefined") {
      void import("packages/features/search/utils/googleMaps").then(({ googleMapsService }) => {
        void googleMapsService.loadGoogleMapsScript();
      });
    }
    return;
  }
  if (path.startsWith("/messaging")) {
    traceDynamicImport(
      LOG_CATEGORIES.MESSAGES,
      "prefetch:AgentPage",
      import("@/pages/workspace/AgentPage")
    );
    // AgentFeature lazy-loads ClientMessaging / AgentDashboard; prewarm in parallel with AgentPage
    // so first navigation avoids a sequential chunk waterfall.
    prefetchAgentMessagingFeatureChunks("all");
    return;
  }
  if (path.startsWith("/find-agents")) {
    traceDynamicImport(
      LOG_CATEGORIES.ROUTING,
      "prefetch:FindAgentsPage",
      import("@/pages/misc/FindAgentsPage")
    );
    return;
  }
  if (path.startsWith("/dashboard")) {
    traceDynamicImport(
      LOG_CATEGORIES.DASHBOARD,
      "prefetch:DashboardPage",
      import("@/pages/workspace/DashboardPage")
    );
    return;
  }
  if (path.startsWith("/saved") || path.startsWith("/compare-reports")) {
    traceDynamicImport(
      LOG_CATEGORIES.ROUTING,
      "prefetch:SavedPage",
      import("@/pages/property/SavedPage")
    );
    return;
  }
  if (path.startsWith("/profile")) {
    traceDynamicImport(
      LOG_CATEGORIES.ROUTING,
      "prefetch:ProfilePage",
      import("@/pages/account/ProfilePage")
    );
    return;
  }
  if (/^\/agreements\/[^/]+\/complete\/?$/.test(path)) {
    traceDynamicImport(
      LOG_CATEGORIES.ROUTING,
      "prefetch:AgreementSigningCompletePage",
      import("@/pages/workspace/AgreementSigningCompletePage")
    );
    return;
  }
}
