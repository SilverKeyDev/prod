import { useEffect, useMemo } from "react";

import { useAuthStore, useUserStore, useWorkspaceStore } from "packages/store";

/**
 * Keeps workspace allowed/active list in sync with auth user and user profile roles.
 * Mount once under the authenticated shell (e.g. AuthShellProviders).
 */
export function useWorkspaceIdentitySync(): void {
  const user = useAuthStore((s) => s.user);
  const userProfile = useUserStore((s) => s.userProfile);
  const syncFromIdentity = useWorkspaceStore((s) => s.syncFromIdentity);

  const mergedUser = useMemo(() => {
    if (!user) return null;
    const fromProfile = userProfile?.brokerage_org_ids;
    if (fromProfile === undefined) return user;
    if (fromProfile === user.brokerage_org_ids) return user;
    return { ...user, brokerage_org_ids: fromProfile };
  }, [user, userProfile]);

  useEffect(() => {
    const profileRoles = userProfile?.roles;
    const rolesArray = Array.isArray(profileRoles)
      ? (profileRoles as unknown[]).filter((r): r is string => typeof r === "string")
      : undefined;
    syncFromIdentity({ user: mergedUser, profileRoles: rolesArray });
  }, [mergedUser, userProfile, syncFromIdentity]);
}
