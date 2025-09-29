/**
 * Authentication Guard
 * Checks if user is logged in; redirects or shows login if not authenticated
 */

import { Lock, LogIn, Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import Card from "../../components/layout/Card";
import Button from "../../components/ui/button/Button";
import {
  useSessionStore,
  selectAuthReady,
  selectIsAuthenticated,
} from "../../../../packages/store";
import { useAuth } from "../providers";

type AuthGuardProps = {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
  requireAuth?: boolean;
};

export type { AuthGuardProps };

export function AuthGuard({
  children,
  redirectTo = "/login",
  fallback,
  requireAuth = true,
}: AuthGuardProps) {
  // Prefer Zustand session store if available; fallback to existing provider
  const storeAuthReady = useSessionStore(selectAuthReady);
  const storeIsAuthenticated = useSessionStore(selectIsAuthenticated);
  const { isAuthenticated: ctxIsAuthenticated, authReady: ctxAuthReady } =
    useAuth() as {
      isAuthenticated: boolean;
      authReady: boolean;
    };
  const authReady =
    typeof storeAuthReady === "boolean" ? storeAuthReady : ctxAuthReady;
  const isAuthenticated =
    typeof storeIsAuthenticated === "boolean"
      ? storeIsAuthenticated
      : ctxIsAuthenticated;
  const location = useLocation();

  // Show loading state while checking authentication
  // This prevents premature redirects during StrictMode double-mount
  if (!authReady) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Card className="w-full max-w-sm" padding="lg">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-accent" />
              <p className="text-gray-600">Checking authentication...</p>
            </div>
          </Card>
        </div>
      )
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // If redirectTo is provided, redirect to login with return URL
    if (redirectTo) {
      return (
        <Navigate to={redirectTo} state={{ from: location.pathname }} replace />
      );
    }

    // Otherwise show inline login prompt
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card
            className="w-full max-w-md border-l-4 border-l-brand-accent"
            padding="lg"
          >
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-brand-accent/10 p-3">
                  <Lock className="h-8 w-8 text-brand-accent" />
                </div>
              </div>

              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Authentication Required
              </h2>

              <p className="mb-6 text-gray-600">
                You need to be logged in to access this page.
              </p>

              <Button
                variant="primary"
                onClick={() => (window.location.href = redirectTo)}
                icon={<LogIn className="h-4 w-4" />}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </Card>
        </div>
      )
    );
  }

  // If authentication is not required but user is authenticated (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated or authentication is not required
  return <>{children}</>;
}

export default AuthGuard;
