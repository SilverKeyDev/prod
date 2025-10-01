import type { PropsWithChildren } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

import { useAuth } from "../providers/auth/useAuth";

/**
 * ProtectedRoute component that wraps routes requiring authentication
 * Waits for auth bootstrap to complete, then makes single routing decision
 * Prevents redirect loops and race conditions
 */
export const ProtectedRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  // Wait for bootstrap to complete - prevents early redirects
  if (status === "booting") {
    return null; // or show splash screen
  }

  // Once ready, redirect unauthenticated users to login
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // User is authenticated, render protected content
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
