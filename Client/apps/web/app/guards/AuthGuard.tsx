/**
 * Authentication Guard
 * Shows UI based on auth status - NEVER redirects
 * All redirects are owned by ProtectedRoute or LoginPage
 */

import { Lock, LogIn, Loader2 } from "lucide-react";
import { type ReactNode } from "react";

import Card from "../../components/layout/Card";
import Button from "../../components/ui/button/Button";
import { useAuth } from "../providers/auth/useAuth";

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
  const { status } = useAuth();

  // Show loading state while booting
  if (status === "booting") {
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
  // Show inline prompt - do NOT redirect (that's ProtectedRoute's job)
  if (requireAuth && status === "unauthenticated") {
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

  // User is authenticated or authentication is not required
  return <>{children}</>;
}

export default AuthGuard;
