import { useMemo } from "react";

import { Navigate, Route, useLocation } from "react-router-dom";

import RouteErrorBoundary from "@/app/error/RouteErrorBoundary";
import type { UserProfile } from "@/features/homeauth/types";
import AgentProfilePage from "@/pages/misc/AgentProfilePage";
import PropertyDetailsPage from "@/pages/property/PropertyDetailsPage";
import AdminAnalyticsOutlet from "@/pages/workspace/admin/AdminAnalyticsOutlet";
import AdminLoggingOutlet from "@/pages/workspace/admin/AdminLoggingOutlet";
import AdminNotificationsOutlet from "@/pages/workspace/admin/AdminNotificationsOutlet";
import AdminPartnersOutlet from "@/pages/workspace/admin/AdminPartnersOutlet";
import AdminPlatformHealthOutlet from "@/pages/workspace/admin/AdminPlatformHealthOutlet";
import AdminSuperadminOutlet from "@/pages/workspace/admin/AdminSuperadminOutlet";
import AdminPage from "@/pages/workspace/AdminPage";

import { createProtectedRoute } from "./RouteConfig";
import { ROUTE_CONFIGS } from "./routeConfigExports";

/** Admin UI route is omitted from the build unless explicitly enabled (reduces exposed surface). */
const ADMIN_PANEL_ENABLED = import.meta.env.VITE_ENABLE_ADMIN_PANEL === "true";

function SettingsRedirect() {
  const location = useLocation();
  const newPath = `/profile${location.pathname.replace(/^\/settings/, "")}`;
  return <Navigate to={newPath} replace />;
}

type DynamicRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

/** Single shared element so the dashboard shell stays mounted across route changes. */
function useProtectedDashboardElement(user: UserProfile | null, handleLogout: () => void) {
  return useMemo(() => createProtectedRoute(user ?? undefined, handleLogout), [handleLogout, user]);
}

export function DynamicRoutes({ user, handleLogout }: DynamicRoutesProps) {
  const protectedElement = useProtectedDashboardElement(user, handleLogout);

  const routes = useMemo(() => {
    const baseRoutes = [
      /* Redirect deprecated routes */
      <Route
        key="buyer-checklists-redirect"
        path="/buyer-checklists"
        element={<Navigate to="/dashboard" replace />}
      />,
      <Route key="settings-redirect" path="/settings/*" element={<SettingsRedirect />} />,
      /* Lightweight Protected Routes – same element so shell persists */
      ...ROUTE_CONFIGS.lightweight.map((path) => (
        <Route key={path} path={path} element={protectedElement} />
      )),
      /* Standard Protected Routes */
      ...ROUTE_CONFIGS.standard.map((path) => (
        <Route key={path} path={path} element={protectedElement} />
      )),
      /* Specialized Protected Routes (e.g. search with maps) – same shell */
      ...ROUTE_CONFIGS.specialized.map(({ path }) => (
        <Route key={path} path={path} element={protectedElement} />
      )),
    ];

    // Register only when VITE_ENABLE_ADMIN_PANEL=true (see Client/.env.example). Server-side admin APIs remain authoritative.
    if (ADMIN_PANEL_ENABLED) {
      baseRoutes.push(
        <Route key="/admin" path="/admin" element={<AdminPage />}>
          <Route index element={<Navigate to="logging" replace />} />
          <Route path="platform-health" element={<AdminPlatformHealthOutlet />} />
          <Route path="analytics" element={<AdminAnalyticsOutlet />} />
          <Route path="notifications" element={<AdminNotificationsOutlet />} />
          <Route path="logging" element={<AdminLoggingOutlet />} />
          <Route path="partners" element={<AdminPartnersOutlet />} />
          <Route path="superadmin" element={<AdminSuperadminOutlet />} />
        </Route>
      );
    }

    // Property details route: public route for shareable property URLs
    baseRoutes.push(
      <Route
        key="/property"
        path="/property/:zpid/:slug?"
        element={<PropertyDetailsPage />}
        errorElement={<RouteErrorBoundary />}
      />
    );

    baseRoutes.push(
      <Route
        key="/a"
        path="/a/:publicSlug"
        element={<AgentProfilePage />}
        errorElement={<RouteErrorBoundary />}
      />
    );

    baseRoutes.push(
      <Route
        key="/agent-profile"
        path="/agent-profile/:name/:briefSlug"
        element={<AgentProfilePage />}
        errorElement={<RouteErrorBoundary />}
      />
    );

    return baseRoutes;
  }, [protectedElement]);

  return routes;
}
