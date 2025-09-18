import React, { type PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuthStore } from "../../core/store/auth.slice";

/**
 * ProtectedRoute component that wraps routes requiring authentication
 * Redirects to login if user is not authenticated, preserving the intended destination
 */
export const ProtectedRoute: React.FC<PropsWithChildren> = ({ children }) => {
  const authStatus = useAuthStore((s) => s.authStatus);
  const authReady = useAuthStore((s) => s.authReady);
  const location = useLocation();
  const [lastRedirectTime, setLastRedirectTime] = React.useState(0);
  const [hasLoggedRedirect, setHasLoggedRedirect] = React.useState(false);

  // Wait for auth to be ready before making navigation decisions
  if (!authReady) {
    return null; // Let AuthGuard handle the loading state
  }

  // Don't redirect while checking auth status
  if (authStatus === "checking") {
    return null; // Wait for auth status to be determined
  }

  // Prevent redirect loops - don't redirect if already on login page
  if (authStatus === "unauthenticated" && location.pathname !== "/login") {
    const now = Date.now();
    // Prevent rapid successive redirects (throttle to max 1 per 100ms)
    if (now - lastRedirectTime < 100) {
      // Only log throttling once per session to avoid spam
      if (!hasLoggedRedirect) {
        console.log(
          "🧭 [PROTECTED_ROUTE] Throttling redirect to prevent rapid navigation"
        );
        setHasLoggedRedirect(true);
      }
      return <>{children}</>;
    }

    setLastRedirectTime(now);
    // Only log redirect once per session to avoid spam
    if (!hasLoggedRedirect) {
      console.log(
        "🧭 [PROTECTED_ROUTE] Redirecting to /login from:",
        location.pathname
      );
      setHasLoggedRedirect(true);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
