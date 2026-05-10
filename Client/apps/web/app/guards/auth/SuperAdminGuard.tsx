import type { ReactNode } from "react";

import { authUtils, PERMISSIONS, UserRole } from "packages/config/auth/auth";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { log, LOG_CATEGORIES } from "packages/logger";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";

type SuperAdminGuardProps = {
  children: ReactNode;
};

export function SuperAdminGuard({ children }: SuperAdminGuardProps) {
  const { user, authStatus } = useAuthStoreIntegration();
  const { userProfile, userProfileLoading } = useUserData();

  if (authStatus === "checking" || userProfileLoading) {
    return null;
  }

  const roles = userProfile?.roles ?? user?.roles ?? [];
  const effectiveRole = roles.includes("super_admin") ? UserRole.SUPER_ADMIN : null;
  const authorized =
    effectiveRole !== null && authUtils.hasPermission(effectiveRole, PERMISSIONS.FULL_ACCESS);

  if (!authorized) {
    if (user?.id) {
      log.security(LOG_CATEGORIES.SECURITY, "[SUPERADMIN_GUARD] Unauthorized superadmin panel access", {
        userId: user.id,
        roles,
      });
    }
    return (
      <Box className="flex min-h-[40vh] items-center justify-center p-4">
        <Card border="none" className="w-full max-w-md border-l-4 border-l-primary" padding="lg">
          <Box className="text-center">
            <Title size="lg" as="h2" className="mb-2">
              Super admin required
            </Title>
            <BodyText size="sm" muted>
              Only SilverKey super administrators can open these tools.
            </BodyText>
          </Box>
        </Card>
      </Box>
    );
  }

  return <>{children}</>;
}
