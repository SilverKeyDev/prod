import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import type { AppRouteConfig } from "packages/navigation";

import { ProtectedRoute } from "@/app/guards";
import { DashboardLayout } from "@/app/layouts";
import { AuthShellProviders } from "@/app/providers/auth/AuthShellProviders";
import { MapsOnly } from "@/app/providers/page/MapsOnly";
import { useLocationOverride } from "@/app/routes/locationOverrideContext";
import type { UserProfile } from "@/features/homeauth/types";

// Re-export route configuration types and constants from packages
export type { AppRouteConfig, RouteCategory } from "packages/navigation";
export { ROUTE_CONFIGS } from "packages/navigation";

/** Stable key so the dashboard shell stays mounted across route changes (Meta-style persistent chrome). */
const DASHBOARD_SHELL_KEY = "dashboard-shell";

/**
 * Wraps the dashboard layout with MapsOnly when on /search so the tree structure
 * is identical for all dashboard routes and React reuses the same instance.
 */
function ConditionalMapsWrapper({ children, pathname }: { children: ReactNode; pathname: string }) {
  if (pathname.startsWith("/search")) {
    return <MapsOnly>{children}</MapsOnly>;
  }
  return <>{children}</>;
}

/**
 * Single protected dashboard shell used for all dashboard routes. Persists across
 * navigation so sidebar and header do not remount.
 */
function ProtectedDashboardShell({ user, onLogout }: { user?: UserProfile; onLogout: () => void }) {
  const routerLocation = useLocation();
  const locationOverride = useLocationOverride();
  const pathname = (locationOverride ?? routerLocation).pathname;
  return (
    <ProtectedRoute>
      <AuthShellProviders>
        <ConditionalMapsWrapper pathname={pathname}>
          <DashboardLayout key={DASHBOARD_SHELL_KEY} user={user} onLogout={onLogout} />
        </ConditionalMapsWrapper>
      </AuthShellProviders>
    </ProtectedRoute>
  );
}

/**
 * Creates the protected dashboard shell element. Use the same returned element
 * reference for all dashboard routes so the shell stays mounted (Meta-style).
 */
export function createProtectedRoute(
  user?: UserProfile,
  onLogout?: () => void,
  _providerType?: AppRouteConfig["providerType"],
  _routeKey?: string
) {
  return <ProtectedDashboardShell user={user} onLogout={onLogout ?? (() => {})} />;
}
