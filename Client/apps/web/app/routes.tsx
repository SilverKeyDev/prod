import { Suspense } from "react";
import { Routes, Route, Navigate, useInRouterContext } from "react-router-dom";

import type { UserProfile } from "../../../packages/schemas/user";
import { useGoogleMapsStoreIntegration } from "../../../packages/hooks/store/useGoogleMapsStoreIntegration";
import { useMessagePolling } from "../../../packages/hooks/data/useMessagePolling";

// Modular route components
import { DynamicRoutes } from "./routes/DynamicRoutes";
import { PublicRoutes } from "./routes/PublicRoutes";

type AppRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

// Component that handles store integrations - must be inside Router context
function StoreIntegrations() {
  useGoogleMapsStoreIntegration();
  // Initialize message polling for notifications
  useMessagePolling();
  return null;
}

// Wrapper that only renders StoreIntegrations when Router context is available
// This prevents React 18 concurrent rendering issues in production
function StoreIntegrationsWrapper() {
  const inRouter = useInRouterContext();
  
  // Only render StoreIntegrations when Router context is confirmed available
  // This ensures all hooks inside StoreIntegrations can safely use Router hooks
  if (!inRouter) {
    return null;
  }
  
  return <StoreIntegrations />;
}

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  return (
    <>
      {/* Store integrations - rendered inside Router context */}
      {/* Wrapper ensures Router context is available before initializing hooks */}
      <StoreIntegrationsWrapper />
      <Suspense
        fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}
      >
        <Routes>
          {/* Public Routes */}
          {PublicRoutes()}

          {/* Protected Routes */}
          {DynamicRoutes({ user, handleLogout })}

          {/* Legacy redirect */}
          <Route path="/app/*" element={<Navigate to="/search" replace />} />

          {/* 404 catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
