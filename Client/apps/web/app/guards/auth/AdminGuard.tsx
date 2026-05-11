import { type ReactNode, useEffect, useRef } from "react";

import { Icon } from "@ui/icons";

import { authUtils, PERMISSIONS, UserRole } from "packages/config/auth/auth";
import { useUserData } from "packages/hooks/data/user/useUserData";
import { log, LOG_CATEGORIES } from "packages/logger";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import Card from "@/components/layout/Card.web";
import { BodyText, Title } from "@/components/ui";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";

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
        log.info(LOG_CATEGORIES.ROUTING, "[ADMIN_GUARD] gate cleared — rendering admin subtree", {
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

    log.info(LOG_CATEGORIES.ROUTING, "[ADMIN_GUARD] gate blocking (Loading admin access…)", {
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

  // Block only until we have a session and an initial profile (or give up on loading).
  // Do not unmount admin layout on background refetches (userProfileLoading with cached userProfile).
  if (authStatus === "checking" || (userProfileLoading && userProfile == null)) {
    return (
      <Box className="flex min-h-screen items-center justify-center bg-background-base">
        <Card border="light" className="w-full max-w-sm" padding="lg">
          <Box className="text-center">
            <Icon name="loader-2" className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
            <BodyText size="sm" muted>
              Loading admin access…
            </BodyText>
          </Box>
        </Card>
      </Box>
    );
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
  // To grant admin access, add role admin or super_admin in user_roles:
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
