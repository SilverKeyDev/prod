import type { PropsWithChildren } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";

import { useAuth } from "../providers/auth/useAuth";

/**
 * ProtectedRoute component that wraps routes requiring authentication
 * Waits for auth bootstrap to complete, then makes single routing decision
 * Prevents redirect loops and race conditions
 */
export const ProtectedRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const { status, authReady } = useAuth();
  const location = useLocation();

  // Wait for bootstrap to complete - prevents early redirects and flicker
  if (!authReady || status === "booting") {
    return null; // Could render a full-page skeleton here
  }

  // Once ready, redirect unauthenticated users to login
  if (status === "unauthenticated") {
    // Build intended path from current location (pathname + search + hash)
    const intended =
      typeof location.pathname === "string" && location.pathname.startsWith("/")
        ? `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`
        : "/";
    // Never set /login as a return target
    const safeIntended = intended.startsWith("/login") ? "/" : intended;
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: { pathname: safeIntended } }}
      />
    );
  }

  // User is authenticated, render protected content
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
