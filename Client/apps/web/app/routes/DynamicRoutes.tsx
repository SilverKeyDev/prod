import { type ReactElement, useMemo } from "react";

import { Navigate, Route, useLocation } from "react-router-dom";

import { AgentAnalyticsPage } from "packages/features/brokerage/components/analytics/AgentAnalyticsPage";

import RouteErrorBoundary from "@/app/error/RouteErrorBoundary";
import type { UserProfile } from "@/features/homeauth/types";
import AgentProfilePage from "@/pages/misc/AgentProfilePage";
import PropertyDetailsPage from "@/pages/property/PropertyDetailsPage";
import AdminDevPersonaOutlet from "@/pages/workspace/admin/AdminDevPersonaOutlet";
import AdminIntegrationsOutlet from "@/pages/workspace/admin/AdminIntegrationsOutlet";
import AdminLoggingOutlet from "@/pages/workspace/admin/AdminLoggingOutlet";
import AdminPartnersOutlet from "@/pages/workspace/admin/AdminPartnersOutlet";
import AdminSuperadminOutlet from "@/pages/workspace/admin/AdminSuperadminOutlet";
import AdminSupportMessagingOutlet from "@/pages/workspace/admin/AdminSupportMessagingOutlet";
import AdminWikiOutlet from "@/pages/workspace/admin/AdminWikiOutlet";
import AdminPage from "@/pages/workspace/AdminPage";
import { ProtectedRoute } from "@/app/guards/auth/ProtectedRoute";

import { createProtectedRoute } from "./RouteConfig";
import { ROUTE_CONFIGS } from "./routeConfigExports";

function SettingsRedirect() {
  const location = useLocation();
  const newPath = `/profile${location.pathname.replace(/^\/settings/, "")}`;
  return <Navigate to={newPath} replace />;
}

type DynamicRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

function useProtectedDashboardElement(user: UserProfile | null, handleLogout: () => void) {
  return useMemo(() => createProtectedRoute(user ?? undefined, handleLogout), [handleLogout, user]);
}

function useStableNonDashboardRoutes(): ReactElement[] {
  return useMemo(() => {
    const trailing: ReactElement[] = [];

    trailing.push(
      <Route key="/admin" path="/admin" element={<AdminPage />}>
        <Route index element={<Navigate to="logging" replace />} />
        <Route path="operations" element={<Navigate to="/admin/logging" replace />} />
        <Route path="platform-health" element={<Navigate to="/admin/logging" replace />} />
        <Route path="notifications" element={<Navigate to="/admin/logging" replace />} />
        <Route path="logging" element={<AdminLoggingOutlet />} />
        <Route path="wiki/*" element={<AdminWikiOutlet />} />
        <Route path="integrations" element={<AdminIntegrationsOutlet />} />
        <Route path="partners" element={<AdminPartnersOutlet />} />
        <Route path="support-messaging" element={<AdminSupportMessagingOutlet />} />
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
      />,
      <Route
        key="/dashboard/agent"
        path="/dashboard/agent/:agentSlug"
        element={
          <ProtectedRoute>
            <AgentAnalyticsPage />
          </ProtectedRoute>
        }
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
        key="buyer-checklists-redirect"
        path="/buyer-checklists"
        element={<Navigate to="/dashboard" replace />}
      />,
      <Route
        key="analytics-redirect"
        path="/analytics"
        element={<Navigate to="/dashboard" replace />}
      />,
      <Route key="settings-redirect" path="/settings/*" element={<SettingsRedirect />} />,
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
