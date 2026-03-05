import { useMemo } from "react";

import { Navigate, Route, useLocation } from "react-router-dom";

import type { UserProfile } from "@/features/homeauth/types";

import { createProtectedRoute, ROUTE_CONFIGS } from "./RouteConfig";

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

  const routes = useMemo(
    () => [
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
    ],
    [protectedElement]
  );

  return routes;
}
