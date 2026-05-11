/**
 * Re-export canonical user profile/preferences hooks from `packages/hooks/data/user`.
 * Import path `packages/hooks/data/auth/useUserData` resolves here via tsconfig alias.
 */
export type {
  UserProfileQueryMeta,
  UseUserDataReturn,
  UseUserPreferencesOptions,
  UseUserPreferencesReturn,
} from "packages/hooks/data/user/useUserData";
export { useUserData, useUserPreferences } from "packages/hooks/data/user/useUserData";
