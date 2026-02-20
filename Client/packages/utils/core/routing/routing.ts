/* =========================
   Routing Utilities
   ========================= */

import { AuthenticationError } from "packages/services/http/client";
import { getWindow } from "packages/utils/core/platform";

/**
 * Check if current route starts with given prefix
 */
export const routeStartsWith = (prefix: string): boolean => {
  const win = getWindow();
  return win ? win.location.pathname.startsWith(prefix) : false;
};

/**
 * Check if current route starts with any of the given prefixes
 */
export const routeStartsWithAny = (prefixes: string[]): boolean => {
  return prefixes.some((p) => routeStartsWith(p));
};

/**
 * Check if an error is an authentication error
 */
export function isAuthenticationError(error: unknown): boolean {
  return error instanceof AuthenticationError;
}

/**
 * Handle authentication errors by clearing tokens and redirecting
 */
export function handleAuthenticationError(_error: AuthenticationError) {
  const win = getWindow() as unknown as { clearSecureTokens?: () => void };
  if (win && typeof win.clearSecureTokens === "function") {
    (win as { clearSecureTokens: () => void }).clearSecureTokens();
  }

  if (!routeStartsWith("/login") && !routeStartsWith("/signup")) {
    const w = getWindow();
    if (w) w.location.href = "/login";
  }
}
