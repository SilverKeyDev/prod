/**
 * Role-Based Access Control Guard
 * Takes allowedRoles prop, blocks/redirects if unauthorized
 */

import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers";
import Card from "../../components/layout/Card";
import Button from "../../components/ui/button/Button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export type UserRole = "admin" | "agent" | "client" | "viewer" | "manager";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles, otherwise ANY role
}

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

  // Get user roles (assuming user object has roles array)
  const userRoles: UserRole[] = user.roles || [];

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
      fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card
            className="max-w-md w-full border-l-4 border-l-red-500"
            padding="lg"
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>

              <p className="text-gray-600 mb-2">
                You don't have permission to access this page.
              </p>

              <p className="text-sm text-gray-500 mb-6">
                Required roles: {allowedRoles.join(", ")}
                <br />
                Your roles:{" "}
                {userRoles.length > 0 ? userRoles.join(", ") : "None"}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  onClick={() => window.history.back()}
                  icon={<ArrowLeft className="w-4 h-4" />}
                  className="flex-1"
                >
                  Go Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  icon={<Home className="w-4 h-4" />}
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

/**
 * Higher-order component version of RoleGuard
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: UserRole[],
  guardProps?: Omit<RoleGuardProps, "children" | "allowedRoles">,
) {
  return function RoleGuardedComponent(props: P) {
    return (
      <RoleGuard allowedRoles={allowedRoles} {...guardProps}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

/**
 * Hook to check if current user has specific roles
 */
export function useRoleCheck() {
  const { user } = useAuth();

  const hasRole = (role: UserRole): boolean => {
    const userRoles: UserRole[] = user?.roles || [];
    return userRoles.includes(role);
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    const userRoles: UserRole[] = user?.roles || [];
    return roles.some((role) => userRoles.includes(role));
  };

  const hasAllRoles = (roles: UserRole[]): boolean => {
    const userRoles: UserRole[] = user?.roles || [];
    return roles.every((role) => userRoles.includes(role));
  };

  return {
    hasRole,
    hasAnyRole,
    hasAllRoles,
    userRoles: user?.roles || [],
  };
}

export default RoleGuard;
