import type { UserProfile } from "@/features/homeauth/types";

/** Minimal user from POST /auth/refresh-token (no roles or workspace identity fields). */
export type SessionRefreshUserPatch = {
  id?: string | null;
  email?: string;
  name?: string | null;
  phone?: string | null;
  roles?: readonly string[];
  auth_method?: UserProfile["auth_method"];
  user_sub?: string;
};

/**
 * Apply a refresh-token user patch without dropping persona fields (`roles`, `brokerage_org_ids`, etc.).
 * Refresh responses only carry session identity; dev workspace and profile data must survive.
 */
export function mergeSessionRefreshUserIntoAuthProfile(
  prev: UserProfile,
  patch: SessionRefreshUserPatch
): UserProfile {
  const next: UserProfile = { ...prev };

  if (patch.id) {
    next.id = patch.id;
  }
  if (patch.email) {
    next.email = patch.email;
  }
  if (patch.name !== undefined) {
    next.name = patch.name;
  }
  if (patch.phone !== undefined) {
    next.phone = patch.phone;
  }
  if (patch.roles !== undefined) {
    next.roles = [...patch.roles];
  }
  if (patch.auth_method !== undefined) {
    next.auth_method = patch.auth_method;
  }

  return next;
}
