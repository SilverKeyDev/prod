import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { adminApi } from "packages/features/admin/api/admin";
import type { UserProfile } from "packages/features/homeauth/types/index";
import { useAuthStore, useDevAppPersonaStore, useWorkspaceStore } from "packages/store";
import type { components } from "packages/types/api.generated";
import type { Workspace } from "packages/utils/workspace";
import { writePersistedActiveWorkspace } from "packages/utils/workspace/workspaceSessionStorage";

/** Merge admin dev-workspace wire `User` into the in-memory auth profile. */
function mergeWireUserIntoAuthProfile(
  prev: UserProfile,
  wire: components["schemas"]["User"]
): UserProfile {
  return {
    ...prev,
    id: wire.id ?? prev.id,
    cognito_id: wire.cognito_id ?? prev.cognito_id,
    google_id: wire.google_id ?? prev.google_id,
    email: wire.email,
    name: wire.name ?? prev.name,
    phone: wire.phone ?? prev.phone,
    created_at: wire.created_at ?? prev.created_at,
    updated_at: wire.updated_at ?? prev.updated_at,
    is_active: wire.is_active,
    mls_id: wire.mls_id ?? prev.mls_id,
    brokerage: wire.brokerage ?? prev.brokerage,
    has_preferences: wire.has_preferences ?? prev.has_preferences,
    preferences_version: wire.preferences_version ?? prev.preferences_version,
    profile_picture: wire.profile_picture ?? prev.profile_picture,
    profile_picture_url: wire.profile_picture_url ?? prev.profile_picture_url,
    roles: wire.roles ?? prev.roles,
    brokerage_org_ids: wire.brokerage_org_ids ?? prev.brokerage_org_ids,
  };
}

export function useSetCurrentUserDevWorkspaceMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: components["schemas"]["SetCurrentUserDevWorkspaceRequest"]) =>
      adminApi.setCurrentUserDevWorkspace(body),
    onSuccess: (wireUser, variables) => {
      const workspace = variables.workspace as Workspace;

      writePersistedActiveWorkspace(workspace);

      const prev = useAuthStore.getState().user;
      const merged = prev ? mergeWireUserIntoAuthProfile(prev, wireUser) : null;
      if (merged) {
        useAuthStore.getState().setUser(merged);
      }

      // Apply allowed + active workspace immediately from server identity (do not wait
      // for profile refetch). Seller onboarding calls setActiveWorkspace directly; dev
      // persona must do the same or activeWorkspace can stay on buyer.
      useWorkspaceStore.getState().syncFromIdentity({
        user: merged,
        profileRoles: merged?.roles,
      });
      useWorkspaceStore.getState().setActiveWorkspace(workspace);

      useDevAppPersonaStore.getState().markServerIdentityTouched();
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    },
  });
}
