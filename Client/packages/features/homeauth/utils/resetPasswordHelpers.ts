import type { ResetPasswordStores } from "packages/features/homeauth/types/auth/resetPassword";
import { log, LOG_CATEGORIES } from "packages/logger";

import type { UserProfile } from "@/features/homeauth/types";

type ResetResultUser = {
  id?: string;
  user_sub?: string;
  email: string;
  name?: string;
  phone?: string;
  is_agent?: boolean;
  auth_method?: string;
};

/**
 * Map reset-password API result user to UserProfile and update auth/user stores.
 * Extracted to satisfy max-lines-per-function in ResetPasswordPage.
 */
export function mapResultUserToProfile(resultUser: ResetResultUser, _email: string): UserProfile {
  const userId =
    resultUser.id || ("user_sub" in resultUser ? resultUser.user_sub : undefined) || undefined;
  return {
    id: userId || "",
    email: resultUser.email,
    name: resultUser.name || "Unknown User",
    phone: ("phone" in resultUser ? resultUser.phone : undefined) as string | null | undefined,
    created_at: null,
    is_active: true,
    has_preferences: false,
    is_agent: ("is_agent" in resultUser ? (resultUser.is_agent ?? false) : false) ?? false,
    auth_method: ("auth_method" in resultUser ? resultUser.auth_method : undefined) as
      | "cognito"
      | "google"
      | "both"
      | "unknown"
      | undefined,
  };
}

export type { ResetPasswordStores } from "packages/features/homeauth/types/auth/resetPassword";

/**
 * Update auth and user stores after successful password reset.
 * Setters are passed from the page component (no getState in apps/web).
 */
export function applyStoresAfterReset(
  mappedUser: UserProfile,
  email: string,
  stores: ResetPasswordStores
): void {
  stores.setStoreIsAuthenticated(true);
  stores.setStoreUser(mappedUser);
  stores.setUserProfile({
    ...mappedUser,
    name: mappedUser.name ?? "Unknown User",
  });
  log.info(LOG_CATEGORIES.AUTH, "Password reset and auto-login successful", {
    email,
    userId: mappedUser.id,
    storageMethod: "http_only_cookies",
    authMethod: "cookie_based",
  });
}
