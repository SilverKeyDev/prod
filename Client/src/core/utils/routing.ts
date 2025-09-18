/* =========================
   Routing Utilities
   ========================= */

import { AuthenticationError } from '../services/http/client';

/**
 * Check if current route starts with given prefix
 */
export const routeStartsWith = (prefix: string): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.pathname.startsWith(prefix);
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
  // Clear secure tokens
  if (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { clearSecureTokens?: () => void }).clearSecureTokens === 'function'
  ) {
    (window as unknown as { clearSecureTokens: () => void }).clearSecureTokens();
  }

  // Redirect to login if not already there
  if (!routeStartsWith('/login') && !routeStartsWith('/signup')) {
    window.location.href = '/login';
  }
}
