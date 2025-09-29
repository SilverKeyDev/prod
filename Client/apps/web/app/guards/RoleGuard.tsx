/**
 * Role-Based Access Control Guard
 * Takes allowedRoles prop, blocks/redirects if unauthorized
 */

import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import Card from "../../components/layout/Card";
import Button from "../../components/ui/button/Button";
import type { UserRole } from "../../../../packages/schemas/user";
import { useAuth } from "../providers";

type RoleGuardProps = {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, otherwise ANY role
};

export type { RoleGuardProps, UserRole };

export function RoleGuard({
  children,
  allowedRoles,
  redirectTo = "/unauthorized",
  fallback,
  requireAll = false,
}: RoleGuardProps) {
  const { isAuthenticated, user, authReady } = useAuth();

  // Wait for auth to be ready
  if (!authReady) {
    return null;
  }

  // User must be authenticated first
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Type guard to check if user has roles property
  const hasRoles = (user: unknown): user is { roles?: UserRole[] } => {
    return user !== null && typeof user === "object";
  };

  // Get user roles safely
  const userRoles: UserRole[] = hasRoles(user) ? (user.roles ?? []) : [];

  // Check if user has required roles
  const hasRequiredRoles = requireAll
    ? allowedRoles.every((role) => userRoles.includes(role))
    : allowedRoles.some((role) => userRoles.includes(role));

  if (!hasRequiredRoles) {
    // If redirectTo is provided, redirect
    if (redirectTo && redirectTo !== "/unauthorized") {
      return <Navigate to={redirectTo} replace />;
    }

    // Otherwise show unauthorized message
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card
            className="w-full max-w-md border-l-4 border-l-red-500"
            padding="lg"
          >
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                Access Denied
              </h2>

              <p className="mb-2 text-gray-600">
                You don't have permission to access this page.
              </p>

              <p className="mb-6 text-sm text-gray-500">
                Required roles: {allowedRoles.join(", ")}
                <br />
                Your roles:{" "}
                {userRoles.length > 0 ? userRoles.join(", ") : "None"}
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="primary"
                  onClick={() => window.history.back()}
                  icon={<ArrowLeft className="h-4 w-4" />}
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  icon={<Home className="h-4 w-4" />}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )
    );
  }

  // User has required roles
  return <>{children}</>;
}

export default RoleGuard;
