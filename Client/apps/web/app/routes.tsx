import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

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

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  return (
    <>
      {/* Store integrations - rendered inside Router context */}
      <StoreIntegrations />
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
