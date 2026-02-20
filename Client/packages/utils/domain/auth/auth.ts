/* =========================
   Auth Utility Functions
   ========================= */

import { log, LOG_CATEGORIES } from "logger";

/**
 * @deprecated This file contains legacy authentication utilities.
 * With HTTP-only cookie authentication, most client-side token operations are deprecated.
 *
 * For authentication operations, use:
 * - authApi from packages/config/api/auth.ts for API calls
 * - useSecureAuth from packages/hooks/data/useSecureAuth.ts for React components
 * - useAuthStore from packages/store for state management
 */

/**
 * Legacy placeholder - HTTP-only cookies are managed by the browser automatically
 * @deprecated Authentication is handled via HTTP-only cookies. No client-side token access needed.
 * @returns null
 */
export const getAuthToken = (): string | null => {
  log.warn(
    LOG_CATEGORIES.AUTH,
    "getAuthToken is deprecated. HTTP-only cookies handle authentication automatically.",
  );
  return null;
};

/**
 * Legacy placeholder - use useAuthStore or AuthContext for auth state
 * @deprecated Use useAuthStore((s) => s.isAuthenticated) or useAuth() hook instead
 * @returns false
 */
export const hasValidAuthToken = (): boolean => {
  log.warn(
    LOG_CATEGORIES.AUTH,
    "hasValidAuthToken is deprecated. Use useAuthStore or AuthContext instead.",
  );
  return false;
};

/**
 * Legacy placeholder - use authApi.logout()
 * @deprecated Use authApi.logout() from packages/config/api/auth.ts instead
 */
export const clearAuthTokens = (): void => {
  log.warn(
    LOG_CATEGORIES.AUTH,
    "clearAuthTokens is deprecated. Use authApi.logout() to clear HTTP-only cookies.",
  );
};
