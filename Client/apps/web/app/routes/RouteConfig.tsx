import type { ReactNode } from "react";

import type { AppRouteConfig } from "packages/navigation";

import { ProtectedRoute } from "@/app/guards";
import { DashboardLayout } from "@/app/layouts";
import { AuthShellProviders } from "@/app/providers/auth/AuthShellProviders";
// Page-specific providers
import { DocsOnly } from "@/app/providers/page/DocsOnly";
import { MapsOnly } from "@/app/providers/page/MapsOnly";
import type { UserProfile } from "@/features/homeauth/types";

// Re-export route configuration types and constants from packages
export type { AppRouteConfig, RouteCategory } from "packages/navigation";
export { ROUTE_CONFIGS } from "packages/navigation";

// Provider factory function
function createProviderWrapper(providerType: AppRouteConfig["providerType"]) {
  return (children: ReactNode): ReactNode => {
    switch (providerType) {
      case "maps":
        return <MapsOnly>{children}</MapsOnly>;
      case "docs":
        return <DocsOnly>{children}</DocsOnly>;
      default:
        return children;
    }
  };
}

// Unified protected route creator
export function createProtectedRoute(
  user?: UserProfile,
  onLogout?: () => void,
  providerType?: AppRouteConfig["providerType"],
  /**
   * Forces a remount when switching between top-level routes that share the same
   * layout component (e.g. leaving `/search`). This avoids stale UI when a heavy
   * route keeps fullscreen layers mounted.
   */
  routeKey?: string
) {
  const dashboard = (
    <DashboardLayout
      key={routeKey ?? providerType ?? "dashboard"}
      user={user}
      onLogout={onLogout ?? (() => {})}
    />
  );
  const wrappedDashboard = providerType
    ? createProviderWrapper(providerType)(dashboard)
    : dashboard;

  return (
    <ProtectedRoute>
      <AuthShellProviders>{wrappedDashboard}</AuthShellProviders>
    </ProtectedRoute>
  );
}
