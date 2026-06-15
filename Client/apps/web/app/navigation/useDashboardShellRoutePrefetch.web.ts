import { useDashboardShellRoutePrefetchCore } from "packages/hooks/navigation/useDashboardShellRoutePrefetchCore.web";

import { prefetchDashboardShellRoute } from "./dashboardShellRoutePrefetch.web";

export function useDashboardShellRoutePrefetch(): (href: string) => void {
  return useDashboardShellRoutePrefetchCore(prefetchDashboardShellRoute);
}
