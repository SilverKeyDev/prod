import { Route } from "react-router-dom";

import type { UserProfile } from "../../../../packages/schemas/user";

import { createProtectedRoute, ROUTE_CONFIGS } from "./RouteConfig";

type DynamicRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

export function DynamicRoutes({ user, handleLogout }: DynamicRoutesProps) {
  const userProfile = user ?? undefined;

  return [
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
