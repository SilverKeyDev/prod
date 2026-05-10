import type { ReactNode } from "react";

import { authUtils, PERMISSIONS, UserRole } from "packages/config/auth/auth";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

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

  // Use profile from API (includes roles from backend user_roles); fall back to auth user.
  // Admin panel: only admin + super_admin ("manager" is for team-level product permissions, not SilverKey system admin).
  const roles = userProfile?.roles ?? user?.roles ?? [];
  const hasAdminRole = roles.includes("admin");
  const hasSuperAdminRole = roles.includes("super_admin");

  let effectiveRole: UserRole | null = null;
  if (hasSuperAdminRole) {
    effectiveRole = UserRole.SUPER_ADMIN;
  } else if (hasAdminRole) {
    effectiveRole = UserRole.ADMIN;
  }

  // Check if user has admin role and proper permissions
  // To grant admin access, add role admin or super_admin in user_roles (not user_admin.is_admin):
  //   from app.models import User, UserRole; from app import db
  //   u = User.query.filter_by(email="your@email.com").first()
  //   if u and not any(r.role == "admin" for r in u.user_roles):
  //     db.session.add(UserRole(user_id=u.id, role="admin")); db.session.commit()
  const isAuthorized =
    effectiveRole !== null && authUtils.hasPermission(effectiveRole, PERMISSIONS.MANAGE_SYSTEM);

  if (!isAuthorized) {
    if (user?.id) {
      log.security(LOG_CATEGORIES.SECURITY, "[ADMIN_GUARD] Unauthorized admin access attempt", {
        userId: user.id,
        roles,
      });
    }

    return (
      <Box className="flex min-h-screen items-center justify-center bg-background-base p-4">
        <Card border="none" className="w-full max-w-md border-l-4 border-l-primary" padding="lg">
          <Box className="text-center">
            <Title size="lg" as="h2" className="mb-2">
              Admin Access Required
            </Title>
            <BodyText size="sm" muted className="mb-4">
              You do not have permission to access this admin page. If you believe this is an error,
              please contact your SilverKey administrator.
            </BodyText>
          </Box>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
