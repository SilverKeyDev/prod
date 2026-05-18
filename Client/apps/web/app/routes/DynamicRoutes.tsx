import { type ReactElement, useMemo } from "react";

import { Navigate, Route, useLocation } from "react-router-dom";

import RouteErrorBoundary from "@/app/error/RouteErrorBoundary";
import type { UserProfile } from "@/features/homeauth/types";
import AgentProfilePage from "@/pages/misc/AgentProfilePage";
import PropertyDetailsPage from "@/pages/property/PropertyDetailsPage";
import AdminDevPersonaOutlet from "@/pages/workspace/admin/AdminDevPersonaOutlet";
import AdminLoggingOutlet from "@/pages/workspace/admin/AdminLoggingOutlet";
import AdminNotificationsOutlet from "@/pages/workspace/admin/AdminNotificationsOutlet";
import AdminPartnersOutlet from "@/pages/workspace/admin/AdminPartnersOutlet";
import AdminPlatformHealthOutlet from "@/pages/workspace/admin/AdminPlatformHealthOutlet";
import AdminSuperadminOutlet from "@/pages/workspace/admin/AdminSuperadminOutlet";
import AdminPage from "@/pages/workspace/AdminPage";

import { LegacyWorkspaceShellPrefixRedirect } from "./LegacyWorkspaceShellPrefixRedirect";
import { createProtectedRoute } from "./RouteConfig";
import { ROUTE_CONFIGS } from "./routeConfigExports";

function SettingsRedirect() {
  const location = useLocation();
  const newPath = `/profile${location.pathname.replace(/^\/settings/, "")}`;
  return <Navigate to={newPath} replace />;
}

function LegacySavedPathRedirect() {
  const location = useLocation();
  const suffix = location.pathname === "/saved" ? "" : location.pathname.slice("/saved".length);
  const to = `/library${suffix}${location.search ?? ""}`;
  return <Navigate to={to} replace />;
}

type DynamicRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

/** Single shared element so the dashboard shell stays mounted across route changes. */
function useProtectedDashboardElement(user: UserProfile | null, handleLogout: () => void) {
  return useMemo(() => createProtectedRoute(user ?? undefined, handleLogout), [handleLogout, user]);
}

/** Routes that do not use `protectedElement` must not live in the same useMemo as `[protectedElement]`,
 *  or they get new `<Route>` instances whenever `user` updates and remount (e.g. admin step-up loop). */
function useStableNonDashboardRoutes(): ReactElement[] {
  return useMemo(() => {
    const trailing: ReactElement[] = [];

    trailing.push(
      <Route key="/admin" path="/admin" element={<AdminPage />}>
        <Route index element={<Navigate to="logging" replace />} />
        <Route path="platform-health" element={<AdminPlatformHealthOutlet />} />
        <Route path="analytics" element={<Navigate to="/admin/logging" replace />} />
        <Route path="notifications" element={<AdminNotificationsOutlet />} />
        <Route path="logging" element={<AdminLoggingOutlet />} />
        <Route path="partners" element={<AdminPartnersOutlet />} />
        <Route path="dev-persona" element={<AdminDevPersonaOutlet />} />
        <Route path="superadmin" element={<AdminSuperadminOutlet />} />
      </Route>
    );

    trailing.push(
      <Route
        key="/property"
        path="/property/:zpid/:slug?"
        element={<PropertyDetailsPage />}
        errorElement={<RouteErrorBoundary />}
      />,
      <Route
        key="/a"
        path="/a/:publicSlug"
        element={<AgentProfilePage />}
        errorElement={<RouteErrorBoundary />}
      />,
      <Route
        key="/agent-profile"
        path="/agent-profile/:name/:briefSlug"
        element={<AgentProfilePage />}
        errorElement={<RouteErrorBoundary />}
      />
    );

    return trailing;
  }, []);
}

export function DynamicRoutes({ user, handleLogout }: DynamicRoutesProps) {
  const protectedElement = useProtectedDashboardElement(user, handleLogout);
  const stableTrailingRoutes = useStableNonDashboardRoutes();

  const stableLeadingRoutes = useMemo(
    () => [
      <Route
        key="legacy-buyer-shell-exact"
        path="/buyer"
        element={<LegacyWorkspaceShellPrefixRedirect />}
      />,
      <Route
        key="legacy-buyer-shell"
        path="/buyer/*"
        element={<LegacyWorkspaceShellPrefixRedirect />}
      />,
      <Route
        key="legacy-brokerage-shell-exact"
        path="/brokerage"
        element={<LegacyWorkspaceShellPrefixRedirect />}
      />,
      <Route
        key="legacy-brokerage-shell"
        path="/brokerage/*"
        element={<LegacyWorkspaceShellPrefixRedirect />}
      />,
      <Route
        key="buyer-checklists-redirect"
        path="/buyer-checklists"
        element={<Navigate to="/dashboard" replace />}
      />,
      <Route key="settings-redirect" path="/settings/*" element={<SettingsRedirect />} />,
      <Route key="legacy-saved-to-library" path="/saved/*" element={<LegacySavedPathRedirect />} />,
    ],
    []
  );

  const routes = useMemo(() => {
    return [
      ...stableLeadingRoutes,
      ...ROUTE_CONFIGS.lightweight.map((path) => (
        <Route key={path} path={path} element={protectedElement} />
      )),
      ...ROUTE_CONFIGS.standard.map((path) => (
        <Route key={path} path={path} element={protectedElement} />
      )),
      ...ROUTE_CONFIGS.specialized.map(({ path }) => (
        <Route key={path} path={path} element={protectedElement} />
      )),
      ...stableTrailingRoutes,
    ];
  }, [protectedElement, stableLeadingRoutes, stableTrailingRoutes]);

  return routes;
}
