import { type ReactNode, useEffect, useRef } from "react";

import { Icon } from "@ui/icons";
import Card from "@ui/layout/Card.web";

import { authUtils, PERMISSIONS, UserRole } from "packages/config/auth/auth";
import { useAuthStoreIntegration } from "packages/features/homeauth/hooks/store/useAuthStoreIntegration";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { log } from "packages/logger";
import { useAuthStore } from "packages/store";
import { BodyText, Box, Title } from "packages/ui";

type AdminGuardProps = {
  children: ReactNode;
};

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, authStatus } = useAuthStoreIntegration();
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { userProfile, userProfileLoading, userProfileError, userProfileQueryMeta } = useUserData();

  const blockingChecking = authStatus === "checking";
  const blockingProfile = userProfileLoading && userProfile == null;
  const lastGateLogSigRef = useRef<string | null>(null);

  const lastClearLogSigRef = useRef<string | null>(null);
  useEffect(() => {
    if (!blockingChecking && !blockingProfile) {
      lastGateLogSigRef.current = null;
      const clearSig = [
        String(userProfile != null),
        userProfileQueryMeta.status,
        userProfileQueryMeta.fetchStatus,
        userProfileError ?? "",
      ].join("|");
      if (lastClearLogSigRef.current !== clearSig) {
        lastClearLogSigRef.current = clearSig;
        log.info("ROUTING", "[ADMIN_GUARD] gate cleared — rendering admin subtree", {
          authStatus,
          authReady,
          isAuthenticated,
          hasUserProfile: userProfile != null,
          userProfileQueryStatus: userProfileQueryMeta.status,
          userProfileQueryFetchStatus: userProfileQueryMeta.fetchStatus,
          userProfileQueryIsError: userProfileQueryMeta.isError,
          userProfileQueryFailureCount: userProfileQueryMeta.failureCount,
          userProfileError: userProfileError ?? null,
        });
      }
      return;
    }
    const sig = [
      blockingChecking ? "check" : "",
      blockingProfile ? "prof" : "",
      authStatus,
      String(userProfileLoading),
      String(userProfile != null),
      userProfile?.id ?? "",
      userProfileQueryMeta.status,
      userProfileQueryMeta.fetchStatus,
      String(userProfileQueryMeta.isPending),
      String(userProfileQueryMeta.isFetching),
      String(userProfileQueryMeta.isError),
      String(userProfileQueryMeta.failureCount),
      String(userProfileQueryMeta.dataUpdatedAt),
      String(userProfileQueryMeta.errorUpdatedAt),
      String(authReady),
      String(isAuthenticated),
      userProfileError ?? "",
    ].join("|");
    if (lastGateLogSigRef.current === sig) return;
    lastGateLogSigRef.current = sig;

    log.info("ROUTING", "[ADMIN_GUARD] gate blocking (Loading admin access…)", {
      reason: blockingChecking ? "auth_status_checking" : "profile_initial_load",
      authStatus,
      authReady,
      isAuthenticated,
      userProfileLoading,
      hasUserProfile: userProfile != null,
      userProfileId: userProfile?.id ?? null,
      userProfileQueryStatus: userProfileQueryMeta.status,
      userProfileQueryFetchStatus: userProfileQueryMeta.fetchStatus,
      userProfileQueryIsPending: userProfileQueryMeta.isPending,
      userProfileQueryIsFetching: userProfileQueryMeta.isFetching,
      userProfileQueryIsError: userProfileQueryMeta.isError,
      userProfileQueryFailureCount: userProfileQueryMeta.failureCount,
      userProfileDataUpdatedAt: userProfileQueryMeta.dataUpdatedAt,
      userProfileErrorUpdatedAt: userProfileQueryMeta.errorUpdatedAt,
      userProfileError: userProfileError ?? null,
    });
  }, [
    authReady,
    authStatus,
    blockingChecking,
    blockingProfile,
    isAuthenticated,
    userProfile,
    userProfileError,
    userProfileLoading,
    userProfileQueryMeta.dataUpdatedAt,
    userProfileQueryMeta.errorUpdatedAt,
    userProfileQueryMeta.failureCount,
    userProfileQueryMeta.fetchStatus,
    userProfileQueryMeta.isError,
    userProfileQueryMeta.isFetching,
    userProfileQueryMeta.isPending,
    userProfileQueryMeta.status,
  ]);

  if (authStatus === "checking" || (userProfileLoading && userProfile == null)) {
    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center">
        <Card border="light" className="w-full max-w-sm" padding="lg">
          <Box className="text-center">
            <Icon name="loader-2" className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
            <BodyText size="sm" muted>
              Loading admin access…
            </BodyText>
          </Box>
        </Card>
      </Box>
    );
  }

  const roles = userProfile?.roles ?? user?.roles ?? [];
  const hasAdminRole = roles.includes("admin");
  const hasSuperAdminRole = roles.includes("super_admin");

  let effectiveRole: UserRole | null = null;
  if (hasSuperAdminRole) {
    effectiveRole = UserRole.SUPER_ADMIN;
  } else if (hasAdminRole) {
    effectiveRole = UserRole.ADMIN;
  }

  const isAuthorized =
    effectiveRole !== null && authUtils.hasPermission(effectiveRole, PERMISSIONS.MANAGE_SYSTEM);

  if (!isAuthorized) {
    if (user?.id) {
      log.security("SECURITY", "[ADMIN_GUARD] Unauthorized admin access attempt", {
        userId: user.id,
        roles,
      });
    }

    return (
      <Box className="bg-background-base flex min-h-screen items-center justify-center p-4">
        <Card border="none" className="border-l-primary w-full max-w-md border-l-4" padding="lg">
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
