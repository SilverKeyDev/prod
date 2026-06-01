/**
 * Authentication Service Layer
 * @deprecated This service layer is mostly deprecated. Use the following instead:
 * - For logout: useSecureAuth().logout or authApi.logout()
 * - For auth state: useAuthStore or AuthContext
 * - For API calls: authApi from packages/config/api/auth.ts
 *
 * This file is kept for backward compatibility but should not be used in new code.
 */

import type { LogoutResult } from "packages/features/homeauth/types/auth/logout";
import { log, LOG_CATEGORIES } from "packages/logger";

export type { LogoutResult } from "packages/features/homeauth/types/auth/logout";

/**
 * @deprecated Use useSecureAuth().logout or authApi.logout() instead
 */
export const authService = {
  /**
   * @deprecated Use useSecureAuth().logout from packages/hooks/data/useSecureAuth.ts instead
   * This properly calls the backend API and clears HTTP-only cookies
   */
  logout: (): LogoutResult => {
    log.warn(
      LOG_CATEGORIES.AUTH,
      "authService.logout is deprecated. Use useSecureAuth().logout or authApi.logout() instead."
    );
    return { success: false, error: "Use useSecureAuth().logout instead" };
  },
};
