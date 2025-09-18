import { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import type { UserProfile } from "../../core/schemas/user";

// Modular route components
import { DynamicRoutes } from "./DynamicRoutes";
import { PublicRoutes } from "./PublicRoutes";

type AppRoutesProps = {
  user: UserProfile | null;
  handleLogout: () => void;
};

export function AppRoutes({ user, handleLogout }: AppRoutesProps) {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-gray-600">Loading…</div>}
    >
      <Routes>
        {/* Public Routes */}
        {PublicRoutes()}

        {/* Protected Routes */}
        {DynamicRoutes({ user, handleLogout })}

        {/* Legacy redirect */}
        <Route path="/app/*" element={<Navigate to="/dashboard" replace />} />

        {/* 404 catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
