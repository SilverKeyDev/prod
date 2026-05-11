import { log, LOG_CATEGORIES } from "packages/logger";

/**
 * Legacy auth placeholders for HTTP-only cookie auth.
 * Kept in utils so infrastructure code does not depend on a feature package.
 */
export const getAuthToken = (): string | null => {
  log.warn(
    LOG_CATEGORIES.AUTH,
    "getAuthToken is deprecated. HTTP-only cookies handle authentication automatically."
  );
  return null;
};

export const hasValidAuthToken = (): boolean => {
  log.warn(
    LOG_CATEGORIES.AUTH,
    "hasValidAuthToken is deprecated. Use useAuthStore or AuthContext instead."
  );
  return false;
};

export const clearAuthTokens = (): void => {
  log.warn(
    LOG_CATEGORIES.AUTH,
    "clearAuthTokens is deprecated. Use authApi.logout() to clear HTTP-only cookies."
  );
};
