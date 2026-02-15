import { Route, Navigate, useLocation } from "react-router-dom";

import type { UserProfile } from "../../../../packages/schemas/user";

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

export function DynamicRoutes({ user, handleLogout }: DynamicRoutesProps) {
  const userProfile = user ?? undefined;

  return [
    /* Redirect deprecated routes */
    <Route
      key="buyer-checklists-redirect"
      path="/buyer-checklists"
      element={<Navigate to="/dashboard" replace />}
    />,
    <Route
      key="settings-redirect"
      path="/settings/*"
      element={<SettingsRedirect />}
    />,
    /* Lightweight Protected Routes */
    ...ROUTE_CONFIGS.lightweight.map((path) => (
      <Route
        key={path}
        path={path}
        element={createProtectedRoute(userProfile, handleLogout)}
      />
    )),

    /* Standard Protected Routes */
    ...ROUTE_CONFIGS.standard.map((path) => (
      <Route
        key={path}
        path={path}
        element={createProtectedRoute(userProfile, handleLogout)}
      />
    )),

    /* Specialized Protected Routes - Full providers with additional page-specific providers */
    ...ROUTE_CONFIGS.specialized.map(({ path, providerType }) => (
      <Route
        key={path}
        path={path}
        element={createProtectedRoute(userProfile, handleLogout, providerType)}
      />
    )),
  ];
}
