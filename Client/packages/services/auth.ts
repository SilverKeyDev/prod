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

      // 1. Remove auth tokens from all storage locations
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("id_token");
      localStorage.removeItem("signupEmail");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("refresh_token");

      // 2. Clear secure auth tokens via global functions
      const windowWithSecureTokens = window as unknown as {
        clearSecureTokens?: () => void;
      };
      if (windowWithSecureTokens.clearSecureTokens) {
        windowWithSecureTokens.clearSecureTokens();
      }

      // 3. Clear sensitive caches and user context
      clearUserContext();

      // 4. Call backend logout endpoint if available
      // TODO: Implement backend logout endpoint call when available
      // await apiPost('/api/v1/auth/logout', {});

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
   */
  isAuthenticated: (): boolean => {
    // Check secure auth first
    const windowWithSecureAuth = window as unknown as {
      getSecureAccessToken?: () => string | null;
    };
    if (windowWithSecureAuth.getSecureAccessToken) {
      const token = windowWithSecureAuth.getSecureAccessToken();
      if (token) return true;
    }

    // Fallback to session storage
    const sessionToken = sessionStorage.getItem(
      AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    );
    if (sessionToken) return true;

    return false;
  },

  /**
   * Get current access token for API calls
   */
  getAccessToken: (): string | null => {
    // Priority: secure auth -> session storage -> null
    const windowWithSecureAuth = window as unknown as {
      getSecureAccessToken?: () => string | null;
    };
    if (windowWithSecureAuth.getSecureAccessToken) {
      const token = windowWithSecureAuth.getSecureAccessToken();
      if (token) return token;
    }

    return sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
  },
};
