import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { stripWorkspaceShellPrefix } from "packages/utils/layout/dashboardLayoutConfig";

import { ProtectedRoute } from "@/app/guards";
import { DashboardLayout } from "@/app/layouts";
import { AuthShellProviders } from "@/app/providers/auth/AuthShellProviders";
import { MapsOnly } from "@/app/providers/page/MapsOnly";
import { useLocationOverride } from "@/app/routes/locationOverrideContext";
import { ShellCanonicalPathRedirect } from "@/app/routes/ShellCanonicalPathRedirect";
import type { UserProfile } from "@/features/homeauth/types";

/** Stable key so the dashboard shell stays mounted across route changes (Meta-style persistent chrome). */
const DASHBOARD_SHELL_KEY = "dashboard-shell";

/**
 * Wraps the dashboard layout with MapsOnly when on /search so the tree structure
 * is identical for all dashboard routes and React reuses the same instance.
 */
export function ConditionalMapsWrapper({
  children,
  pathname,
}: {
  children: ReactNode;
  pathname: string;
}) {
  const normalized = stripWorkspaceShellPrefix(pathname);
  if (normalized === "/search" || normalized.startsWith("/search/")) {
    return <MapsOnly>{children}</MapsOnly>;
  }
  return <>{children}</>;
}

/**
 * Single protected dashboard shell used for all dashboard routes. Persists across
 * navigation so sidebar and header do not remount.
 */
export function ProtectedDashboardShell({
  user,
  onLogout,
}: {
  user?: UserProfile;
  onLogout: () => void;
}) {
  const routerLocation = useLocation();
  const locationOverride = useLocationOverride();
  const pathname = (locationOverride ?? routerLocation).pathname;
  return (
    <ProtectedRoute>
      <AuthShellProviders>
        <ShellCanonicalPathRedirect />
        <ConditionalMapsWrapper pathname={pathname}>
          <DashboardLayout key={DASHBOARD_SHELL_KEY} user={user} onLogout={onLogout} />
        </ConditionalMapsWrapper>
      </AuthShellProviders>
    </ProtectedRoute>
  );
}
