/**
 * Authentication Guard
 * Checks if user is logged in; redirects or shows login if not authenticated
 */

import { Lock, LogIn, Loader2 } from "lucide-react";
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import Card from "../../components/format/Card";
import Button from "../../components/ui/button/Button";
import { useAuthStore } from "../../core/store/auth.slice";

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
  // Use auth store directly for consistent auth state
  const authStatus = useAuthStore((s) => s.authStatus);
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const location = useLocation();

  // Show loading state while checking authentication or auth status is checking
  // This prevents premature redirects during StrictMode double-mount
  if (!authReady || authStatus === "checking") {
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
    // Prevent redirect loops - don't redirect if already on target page
    if (redirectTo && location.pathname !== redirectTo) {
      console.log(
        "🧭 [AUTH_GUARD] Redirecting to:",
        redirectTo,
        "from:",
        location.pathname
      );
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
