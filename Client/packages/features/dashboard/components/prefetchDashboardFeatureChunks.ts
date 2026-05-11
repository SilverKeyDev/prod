import { LOG_CATEGORIES } from "packages/logger";
import { traceDynamicImport } from "packages/utils/perf/shellRouteLoadTiming";

import {
  loadClientListModule,
  loadDashboardAgreementSigningModalsModule,
  loadDashboardCalendarPanelModule,
  loadDashboardChecklistsModule,
  loadUpcomingEventsModule,
} from "./dashboardFeatureDynamicImports";

/**
 * Prewarm lazy chunks for `/dashboard` (same modules as DashboardFeature's React.lazy).
 * Uses shared loaders in `dashboardFeatureDynamicImports` so prefetch shares one
 * Promise with `React.lazy()`.
 *
 * - `all`: hover / unknown context — agent + client branches in parallel.
 * - `agent` | `client`: when role is known — skips the other role's lazy-only chunk.
 */
export type DashboardFeaturePrefetchBranch = "all" | "agent" | "client";

function prefetchSharedDashboardLazyChunks(): void {
  const cat = LOG_CATEGORIES.DASHBOARD;
  traceDynamicImport(cat, "prefetch:UpcomingEvents", loadUpcomingEventsModule());
  traceDynamicImport(cat, "prefetch:DashboardCalendarPanel", loadDashboardCalendarPanelModule());
  traceDynamicImport(
    cat,
    "prefetch:DashboardAgreementSigningModals",
    loadDashboardAgreementSigningModalsModule()
  );
}

export function prefetchDashboardFeatureChunks(
  branch: DashboardFeaturePrefetchBranch = "all"
): void {
  prefetchSharedDashboardLazyChunks();
  if (branch === "all" || branch === "agent") {
    traceDynamicImport(LOG_CATEGORIES.DASHBOARD, "prefetch:ClientList", loadClientListModule());
  }
  if (branch === "all" || branch === "client") {
    traceDynamicImport(
      LOG_CATEGORIES.DASHBOARD,
      "prefetch:DashboardChecklists",
      loadDashboardChecklistsModule()
    );
  }
}
