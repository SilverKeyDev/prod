/**
 * Best-effort prefetch for dashboard-shell lazy chunks (hover / focus / touch intent).
 * Repeated calls are harmless; the dynamic import promise is deduped by the runtime.
 */
export function prefetchDashboardShellRoute(href: string): void {
  const raw = (href.split("?")[0] ?? "").split("#")[0] ?? "";
  const path = raw.startsWith("/") ? raw : `/${raw}`;

  if (path.startsWith("/search")) {
    void import("@/pages/property/SearchPage");
    return;
  }
  if (path.startsWith("/messaging")) {
    void import("@/pages/workspace/AgentPage");
    return;
  }
  if (path.startsWith("/find-agents")) {
    void import("@/pages/misc/FindAgentsPage");
    return;
  }
  if (path.startsWith("/dashboard")) {
    void import("@/pages/workspace/DashboardPage");
    return;
  }
  if (path.startsWith("/saved") || path.startsWith("/compare-reports")) {
    void import("@/pages/property/SavedPage");
    return;
  }
  if (path.startsWith("/profile")) {
    void import("@/pages/account/ProfilePage");
    return;
  }
  if (/^\/agreements\/[^/]+\/complete\/?$/.test(path)) {
    void import("@/pages/workspace/AgreementSigningCompletePage");
    return;
  }
}
