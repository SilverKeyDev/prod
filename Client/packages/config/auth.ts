/**
 * Auth config entry — re-exports the canonical module under `auth/`.
 * Implementations live in `./auth/auth.ts` only; keep this file as a thin barrel
 * so `packages/config/auth` and `packages/config/auth/auth` stay aligned.
 */
export {
  AUTH_CONFIG,
  AuthEvents,
  AuthStatus,
  authUtils,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  UserRole,
} from "./auth/auth";
