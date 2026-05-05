import type { PropsWithChildren } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { ROUTES } from "packages/navigation";
import { useAuthStore } from "packages/store";

import { AuthBootstrapFallback } from "./AuthBootstrapFallback";

/**
 * ProtectedRoute component that wraps routes requiring authentication
 * Waits for auth bootstrap to complete, then makes single routing decision
 * Prevents redirect loops and race conditions.
 * Reads auth state directly from store to avoid triggering useAuthStoreIntegration
 * (and thus useSecureAuth) in every protected route, which can cause update loops.
 */
export const ProtectedRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const authReady = useAuthStore((s) => s.authReady);
  const authStatus = useAuthStore((s) => s.authStatus);
  const location = useLocation();

  // Wait for bootstrap to complete - prevents early redirects and flicker
  if (!authReady || authStatus === "checking") {
    return <AuthBootstrapFallback />;
  }

  // Once ready, redirect unauthenticated users to login
  if (authStatus === "unauthenticated") {
    // Build intended path from current location (pathname + search + hash)
    const intended =
      typeof location.pathname === "string" && location.pathname.startsWith("/")
        ? `${location.pathname}${location.search ?? ""}${location.hash ?? ""}`
        : "/";
    // Never set /login as a return target
    const safeIntended = intended.startsWith(ROUTES.LOGIN) ? ROUTES.HOME : intended;
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: { pathname: safeIntended } }} />;
  }

  // User is authenticated, render protected content
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
