import type { ReactNode } from "react";

import { authUtils, PERMISSIONS, UserRole } from "packages/config/auth/auth";
import { useUserData } from "packages/hooks/data/useUserData";
import { log, LOG_CATEGORIES } from "packages/logger";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, authStatus } = useAuthStoreIntegration();
  const { userProfile, userProfileLoading } = useUserData();

  if (authStatus === "checking" || userProfileLoading) {
    return null;
  }

  // Use profile from API (includes roles from backend user_roles); fall back to auth user
  const roles = userProfile?.roles ?? user?.roles ?? [];
  const hasAdminRole = roles.includes("admin") || roles.includes("manager");
  const hasSuperAdminRole = roles.includes("super_admin");

  let effectiveRole: UserRole | null = null;
  if (hasSuperAdminRole) {
    effectiveRole = UserRole.SUPER_ADMIN;
  } else if (hasAdminRole) {
    effectiveRole = UserRole.ADMIN;
  }

  // TODO: Re-enable role check when admin roles are properly assigned
  const isAuthorized =
    !!user?.id ||
    (effectiveRole !== null && authUtils.hasPermission(effectiveRole, PERMISSIONS.MANAGE_SYSTEM));

  if (!isAuthorized) {
    if (user?.id) {
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN_GUARD] Unauthorized admin access attempt", {
        userId: user.id,
        roles,
      });
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background-base p-4">
        <Card className="w-full max-w-md border-l-4 border-l-primary" padding="lg">
          <div className="text-center">
            <Title size="lg" as="h2" className="mb-2">
              Admin Access Required
            </Title>
            <BodyText size="sm" muted className="mb-4">
              You do not have permission to access this admin page. If you believe this is an error,
              please contact your SilverKey administrator.
            </BodyText>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
