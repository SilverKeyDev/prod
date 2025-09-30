/**
 * Authentication Service Layer
 * Handles business logic and side effects for authentication operations
 * No React dependencies - pure business logic
 */

import { AUTH_CONFIG } from "../config/auth";

import {
  reportSecurityEvent,
  clearUserContext,
} from "./security/errorReporting";
import { log } from "./security/secureLogger";

export type LogoutResult = {
  success: boolean;
  error?: string;
};

/**
 * Authentication service - single source of truth for auth business logic
 */
export const authService = {
  /**
   * Logout user - handles all business logic and side effects
   * Returns simple success/failure result with no React dependencies
   */
  logout: (): LogoutResult => {
    try {
      log.security("AUTH_SERVICE", "Logout initiated");

      // 1. Remove non-sensitive user data from storage
      // Note: Tokens are in HTTP-only cookies and cannot be cleared client-side
      localStorage.removeItem("user");
      localStorage.removeItem("signupEmail");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("signupEmail");

      // 2. Clear secure auth tokens via global functions (no-op for HTTP-only cookies)
      const windowWithSecureTokens = window as unknown as {
        clearSecureTokens?: () => void;
      };
      if (windowWithSecureTokens.clearSecureTokens) {
        windowWithSecureTokens.clearSecureTokens();
      }

      // 3. Clear sensitive caches and user context
      clearUserContext();

      // 4. Call backend logout endpoint to clear HTTP-only cookies
      // The backend sets the session and refresh_token cookies to expire immediately
      // This is done via POST /api/v1/auth/logout
      // Note: This should be called by the logout hook, not here

      // 5. Record security audit log
      reportSecurityEvent({
        type: "session_anomaly",
        severity: "low",
        description: "User logout completed successfully",
        metadata: { timestamp: new Date().toISOString() },
      });

      log.security("AUTH_SERVICE", "Logout completed successfully");

      return { success: true };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown logout error";

      log.error("AUTH_SERVICE", "Logout failed", { error: errorMessage });

      reportSecurityEvent({
        type: "authentication_failure",
        severity: "medium",
        description: "Logout operation failed",
        metadata: { error: errorMessage },
      });

      return { success: false, error: errorMessage };
    }
  },

  /**
   * Check if user is currently authenticated
   * With HTTP-only cookies, check if user data exists in sessionStorage
   * The actual token is in HTTP-only cookie and not accessible to JS
   */
  isAuthenticated: (): boolean => {
    // Check if user data exists (stored in auth store)
    const userData = sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return !!user && !!user.id;
      } catch {
        return false;
      }
    }

    return false;
  },

  /**
   * Get current access token for API calls
   * With HTTP-only cookies, always returns null so Authorization header is not set
   * Browser automatically sends session cookie with credentials: "include"
   */
  getAccessToken: (): string | null => {
    // HTTP-only cookies: tokens are not accessible to JavaScript
    // The browser automatically includes the session cookie in requests
    // Always return null so no Authorization header is added
    return null;
  },
};
