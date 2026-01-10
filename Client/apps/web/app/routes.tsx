import { Suspense } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import type { UserProfile } from "../../../packages/schemas/user";
import { ROUTES } from "../../../packages/schemas/nav";
import { useGoogleMapsStoreIntegration } from "../../../packages/hooks/store/useGoogleMapsStoreIntegration";
import { useDataPolling } from "../../../packages/hooks/data/useDataPolling";
import { useDataInitialization } from "../../../packages/hooks/data/useDataInitialization";

// Modular route components
import { DynamicRoutes } from "./routes/DynamicRoutes";
import { PublicRoutes } from "./routes/PublicRoutes";

type AppRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

// Component that handles store integrations - must be inside Router context
// This component renders the Outlet (child routes) and initializes store integrations
// IMPORTANT: This component is imported synchronously (not lazy-loaded) to ensure
// Router context is always available when hooks execute, preventing timing issues
// in production builds with code splitting.
function AppLayout() {
  useGoogleMapsStoreIntegration();
  // Initialize data polling (including messages) for notifications
  useDataPolling();
  // Initialize data prefetch and background polling on login
  useDataInitialization();
  // Render child routes
  return <Outlet />;
}

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  return (
    <>
      <Suspense
        fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}
      >
        <Routes>
          {/* Layout route that wraps all routes to ensure Router context is available */}
          {/* This prevents React 18 concurrent rendering issues in production builds */}
          <Route element={<AppLayout />}>
            {/* Public Routes */}
            {PublicRoutes()}

            {/* Protected Routes */}
            {DynamicRoutes({ user, handleLogout })}

            {/* Legacy redirect */}
            <Route
              path={ROUTES.APP}
              element={<Navigate to={ROUTES.SEARCH} replace />}
            />

            {/* 404 catch-all */}
            <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
