import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "packages/config/query/keys";
import { adminApi } from "packages/features/admin/api/admin";
import type { UserProfile } from "packages/features/homeauth/types/index";
import { useAuthStore, useDevAppPersonaStore, useWorkspaceStore } from "packages/store";
import type { components } from "packages/types/api.generated";
import type { Workspace } from "packages/utils/workspace";
import {
  writeDevWorkspacePreviewEnabled,
  writePersistedActiveWorkspace,
} from "packages/utils/workspace/workspaceSessionStorage";

function normalizeClientIds(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return value.join(",");
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function normalizeAgentId(value: unknown): string | undefined {
  if (Array.isArray(value) && value.length > 0) {
    return typeof value[0] === "string" ? value[0] : String(value[0]);
  }
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

/** Merge admin dev-workspace wire `User` into the in-memory auth profile. */
function mergeWireUserIntoAuthProfile(
  prev: UserProfile,
  wire: components["schemas"]["User"]
): UserProfile {
  const nextClientIds = normalizeClientIds(wire.client_ids) ?? prev.client_ids;
  const nextAgentId = normalizeAgentId(wire.agent_id) ?? prev.agent_id;

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
    is_agent: wire.is_agent ?? false,
    mls_id: wire.mls_id ?? prev.mls_id,
    brokerage: wire.brokerage ?? prev.brokerage,
    has_subscription: wire.has_subscription ?? prev.has_subscription,
    subscription: wire.subscription ?? prev.subscription,
    has_preferences: wire.has_preferences ?? prev.has_preferences,
    preferences_version: wire.preferences_version ?? prev.preferences_version,
    profile_picture: wire.profile_picture ?? prev.profile_picture,
    profile_picture_url: wire.profile_picture_url ?? prev.profile_picture_url,
    client_ids: nextClientIds,
    agent_id: nextAgentId,
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

      writeDevWorkspacePreviewEnabled(false);
      writePersistedActiveWorkspace(workspace);
      useWorkspaceStore.getState().setDevPreviewAllWorkspaces(false);

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
