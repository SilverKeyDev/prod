/**
 * Authentication Guard
 * Shows UI based on auth status - NEVER redirects
 * All redirects are owned by ProtectedRoute or LoginPage
 */
import { type ReactNode } from "react";

import { Icon } from "@ui/icons";

import Button from "packages/ui/components/button/Button";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";
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
  const { authStatus } = useAuthStoreIntegration();
  // Show loading state while checking
  if (authStatus === "checking") {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <Card className="w-full max-w-sm" padding="lg">
            <div className="text-center">
              <Icon
                name="loader-2"
                className="mx-auto mb-4 h-8 w-8 animate-spin text-brand-accent"
              />
              <BodyText size="sm" muted>
                Checking authentication...
              </BodyText>
            </div>
          </Card>
        </div>
      )
    );
  }
  // If authentication is required but user is not authenticated
  // Show inline prompt - do NOT redirect (that's ProtectedRoute's job)
  if (requireAuth && authStatus === "unauthenticated") {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md border-l-4 border-l-brand-accent" padding="lg">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-brand-accent/10 p-3">
                  <Icon name="lock" className="h-8 w-8 text-brand-accent" />
                </div>
              </div>

              <Title size="lg" as="h2" className="mb-2">
                Authentication Required
              </Title>

              <BodyText size="sm" muted className="mb-6">
                You need to be logged in to access this page.
              </BodyText>

              <Button
                variant="primary"
                onClick={() => (window.location.href = redirectTo)}
                icon={<Icon name="log-in" className="h-4 w-4" />}
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
