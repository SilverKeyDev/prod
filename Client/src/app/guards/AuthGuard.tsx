/**
 * Authentication Guard
 * Checks if user is logged in; redirects or shows login if not authenticated
 */

import React, { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers";
import Card from "../../components/layout/Card";
import Button from "../../components/ui/button/Button";
import { Lock, LogIn, Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({
  children,
  redirectTo = "/login",
  fallback,
  requireAuth = true,
}: AuthGuardProps) {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  // This prevents premature redirects during StrictMode double-mount
  if (!authReady) {
    return (
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="max-w-sm w-full" padding="lg">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-brand-accent animate-spin mx-auto mb-4" />
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
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card
            className="max-w-md w-full border-l-4 border-l-brand-accent"
            padding="lg"
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-brand-accent/10 rounded-full">
                  <Lock className="w-8 h-8 text-brand-accent" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Required
              </h2>

              <p className="text-gray-600 mb-6">
                You need to be logged in to access this page.
              </p>

              <Button
                variant="primary"
                onClick={() => (window.location.href = redirectTo)}
                icon={<LogIn className="w-4 h-4" />}
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

/**
 * Higher-order component version of AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps?: Omit<AuthGuardProps, "children">,
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...guardProps}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}

export default AuthGuard;
