import { prefetchAgentMessagingFeatureChunks } from "packages/features/agent/components/loading/prefetchAgentMessagingChunks";
import { prefetchDashboardFeatureChunks } from "packages/features/dashboard/components/shell/prefetchDashboardFeatureChunks";
import { stripWorkspaceShellPrefix } from "packages/utils/core/layout/dashboardLayoutConfig";
import { traceDynamicImport } from "packages/utils/core/perf/shellRouteLoadTiming";
import { getWindow } from "packages/utils/core/platform";

export type PrefetchDashboardShellRouteOptions = {
  /** When set, avoids prefetching the opposite role's lazy-only chunks (messaging + dashboard). */
  isAgent?: boolean;
};

function messagingPrefetchBranch(
  opts?: PrefetchDashboardShellRouteOptions
): "all" | "agent" | "client" {
  if (opts?.isAgent === true) return "agent";
  if (opts?.isAgent === false) return "client";
  return "all";
}

function dashboardFeaturePrefetchBranch(
  opts?: PrefetchDashboardShellRouteOptions
): "all" | "agent" | "client" {
  return messagingPrefetchBranch(opts);
}

/**
 * Best-effort prefetch for dashboard-shell lazy chunks (hover / focus / touch intent).
 * Web app page chunks only — lives in the thin app shell (not packages).
 */
export function prefetchDashboardShellRoute(
  href: string,
  options?: PrefetchDashboardShellRouteOptions
): void {
  const raw = (href.split("?")[0] ?? "").split("#")[0] ?? "";
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  const path = stripWorkspaceShellPrefix(normalized);

  if (path.startsWith("/search")) {
    traceDynamicImport("ROUTING", "prefetch:SearchPage", import("@/pages/property/SearchPage"));
    if (getWindow()) {
      void import("packages/features/search/utils/googleMaps").then(({ googleMapsService }) => {
        void googleMapsService.loadGoogleMapsScript();
      });
    }
    return;
  }
  if (path.startsWith("/messaging")) {
    traceDynamicImport("MESSAGES", "prefetch:AgentPage", import("@/pages/workspace/AgentPage"));
    prefetchAgentMessagingFeatureChunks(messagingPrefetchBranch(options));
    return;
  }
  if (path.startsWith("/dashboard")) {
    traceDynamicImport(
      "DASHBOARD",
      "prefetch:DashboardPage",
      import("@/pages/workspace/DashboardPage")
    );
    prefetchDashboardFeatureChunks(dashboardFeaturePrefetchBranch(options));
    return;
  }
  if (
    path.startsWith("/library") ||
    path.startsWith("/saved") ||
    path.startsWith("/compare-reports")
  ) {
    traceDynamicImport("ROUTING", "prefetch:LibraryPage", import("@/pages/property/LibraryPage"));
    return;
  }
  if (path.startsWith("/profile")) {
    traceDynamicImport("ROUTING", "prefetch:ProfilePage", import("@/pages/account/ProfilePage"));
    return;
  }
  if (/^\/agreements\/[^/]+\/complete\/?$/.test(path)) {
    traceDynamicImport(
      "ROUTING",
      "prefetch:AgreementSigningCompletePage",
      import("@/pages/workspace/AgreementSigningCompletePage")
    );
  }
}
