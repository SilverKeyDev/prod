/**
 * Map auth API response to UserProfile for use in auth store and UI
 */

import type { AuthResponse } from "packages/features/homeauth/api/types";

import type { UserProfile } from "@/features/homeauth/types";

type AuthResponseUser = NonNullable<AuthResponse["user"]>;

/**
 * Maps the user object from a successful login/refresh response to UserProfile.
 * Handles both full UserProfile and minimal { id, email, name, user_sub } shapes.
 */
export function mapAuthResponseToUserProfile(
  user: AuthResponseUser,
  userSubTop?: string
): UserProfile {
  const userId = user.id || ("user_sub" in user ? user.user_sub : undefined) || userSubTop;

  return {
    id: userId || "",
    email: user.email,
    name: user.name || "Unknown User",
    phone: ("phone" in user ? user.phone : undefined) as string | null | undefined,
    created_at: null,
    is_active: true,
    has_preferences: false,
    is_agent: ("is_agent" in user ? (user.is_agent ?? false) : false) ?? false,
    roles: ("roles" in user ? user.roles : undefined) as UserProfile["roles"],
    brokerage_org_ids: ("brokerage_org_ids" in user
      ? user.brokerage_org_ids
      : undefined) as UserProfile["brokerage_org_ids"],
    auth_method: ("auth_method" in user ? user.auth_method : undefined) as
      | "cognito"
      | "google"
      | "both"
      | "dev_session"
      | "unknown"
      | undefined,
  };
}

/**
 * Converts UserProfile to user store shape (name as undefined instead of null where needed).
 */
export function toUserStoreProfile(mappedUser: UserProfile): UserProfile & { name?: string } {
  return {
    ...mappedUser,
    name: mappedUser.name || undefined,
  };
}
