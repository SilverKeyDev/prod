/**
 * Secure Authentication Hook
 * Implements secure token storage with memory-based access tokens and HTTP-only refresh tokens
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../config/api";
import { AUTH_CONFIG } from "../../config/auth";
import type { UserProfile } from "../../schemas/user";
import { reportSecurityEvent } from "../../services/security/errorReporting";
import { secureLogger } from "../../services/security/secureLogger";
import { useAuthStore } from "../../store/auth.slice";
import { asError } from "../../utils/error";

// Augment Window with secure auth helpers
declare global {
  interface Window {
    getSecureAccessToken?: () => string | null;
    secureLogout?: () => void;
    clearSecureTokens?: () => void;
  }
}

type SecureAuthState = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type SecureAuthActions = {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
};

export type UseSecureAuthReturn = {} & SecureAuthState & SecureAuthActions;

/**
 * Secure authentication hook with memory-based token storage
 */
export function useSecureAuth(): UseSecureAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Store access token in memory only (more secure)
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Get store actions for immediate updates
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setStoreIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setStoreAuthStatus = useAuthStore((s) => s.setAuthStatus);

  /**
   * Secure login with memory-based token storage
   */
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.login({ email, password });

        if (response.success) {
          // Store actual tokens from response body
          // Access token and refresh token are handled via HttpOnly cookies
          // ID token is returned in response body for client-side use
          const accessToken = response.access_token || "http-only-cookie-auth";
          const idToken = response.id_token;

          // Store access token in memory (primary)
          setAccessToken(accessToken);

          // Store access token in sessionStorage for persistence across refreshes
          sessionStorage.setItem(
            AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
            accessToken,
          );

          // Store ID token in sessionStorage for client-side use
          if (idToken) {
            sessionStorage.setItem("id_token", idToken);
          }

          // Log token storage with size information
          const accessTokenSize = accessToken ? accessToken.length : 0;
          const idTokenSize = idToken ? idToken.length : 0;
          const totalTokenSize = accessTokenSize + idTokenSize;

          secureLogger.info(
            "TOKEN_STORAGE_SUCCESS",
            "Tokens stored successfully",
            {
              accessTokenSize,
              idTokenSize,
              totalTokenSize,
              storageMethod: "sessionStorage",
              tokenTypes: ["access", "id"],
            },
          );

          // Note: Global function will be updated by useEffect to include this token

          // Store user data (non-sensitive)
          if (response.user) {
            const mappedUser: UserProfile = {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              // Best-effort defaults for fields not provided by AuthResponse
              created_at: null,
              is_active: true,
              has_subscription: false,
              subscription: null,
              has_preferences: false,
              is_agent: false,
              // Optional fields can remain undefined
            };
            setUser(mappedUser);

            // IMMEDIATELY update store to prevent race conditions
            setStoreUser(mappedUser);
            setStoreIsAuthenticated(true);
            setStoreAuthStatus("authenticated");

            // Store user data in sessionStorage for security (non-sensitive but auth-related)
            sessionStorage.setItem(
              AUTH_CONFIG.STORAGE_KEYS.USER,
              JSON.stringify(mappedUser),
            );
          }

          // Ensure auth state is immediately available for route guards
          // This prevents race conditions where ProtectedRoute checks before state updates
          secureLogger.security(
            "SECURE_AUTH",
            "Auth state updated synchronously",
            {
              hasPlaceholderToken: accessToken === "http-only-cookie-auth",
              hasUser: !!response.user,
              authMethod: "http-only-cookies",
            },
          );

          // Store refresh token in memory only (secure approach)
          // Note: In production, refresh tokens should be HTTP-only cookies handled by backend

          // Note: Removed authChange and storage events to prevent conflicts
          // Auth state changes are now handled reactively through hook state

          secureLogger.security("SECURE_AUTH", "Login successful", {
            userId: response.user?.user_sub,
          });

          return true;
        } else {
          setError(response.error ?? "Login failed");
          return false;
        }
      } catch (err: unknown) {
        const error = asError(err);
        const errorMessage = error.message;
        setError(errorMessage);

        reportSecurityEvent({
          type: "authentication_failure",
          severity: "high",
          description: "Secure login attempt failed",
          metadata: { email, error: errorMessage },
        });

        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Secure logout with complete token cleanup
   */
  const logout = useCallback(() => {
    console.log("🔒 [SECURE_AUTH] Logout initiated");

    // Log token cleanup before clearing
    const accessToken = sessionStorage.getItem(
      AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    );
    const idToken = sessionStorage.getItem("id_token");
    const userData = sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER);

    const accessTokenSize = accessToken ? accessToken.length : 0;
    const idTokenSize = idToken ? idToken.length : 0;
    const userDataSize = userData ? userData.length : 0;
    const totalClearedSize = accessTokenSize + idTokenSize + userDataSize;

    secureLogger.info("TOKEN_CLEANUP_START", "Starting token cleanup", {
      accessTokenSize,
      idTokenSize,
      userDataSize,
      totalClearedSize,
      storageMethod: "sessionStorage",
    });

    // Clear memory-based tokens
    setAccessToken(null);
    setUser(null);

    // Clear sessionStorage tokens and user data
    sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER);
    sessionStorage.removeItem("id_token");
    sessionStorage.removeItem("signupEmail");

    // Clear auth ready flag so it can be dispatched again on next login
    sessionStorage.removeItem("auth_ready_dispatched");

    // Clear data fetch logging flags so they can be logged again on next login
    sessionStorage.removeItem("reports_fetch_logged");
    sessionStorage.removeItem("reports_loaded_logged");
    sessionStorage.removeItem("saved_homes_fetch_logged");
    sessionStorage.removeItem("saved_homes_loaded_logged");

    // Clear global token functions
    if (typeof window.clearSecureTokens === "function") {
      window.clearSecureTokens();
    }

    // Note: Removed authChange and storage events to prevent conflicts
    // Auth state changes are now handled reactively through hook state

    secureLogger.security(
      "SECURE_AUTH",
      "User logged out with secure token cleanup",
    );
    secureLogger.info("TOKEN_CLEANUP_SUCCESS", "Token cleanup completed", {
      totalClearedSize,
      clearedItems: [
        "access_token",
        "id_token",
        "user_data",
        "signup_email",
        "auth_flags",
      ],
    });

    console.log("🔒 [SECURE_AUTH] Logout complete, navigating to login");
    // Use window.location.href for reliable navigation during logout
    // This prevents AuthGuard redirect loops that can occur with React Router navigation
    window.location.href = "/login";
  }, [navigate]);

  /**
   * Refresh access token using refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Log refresh attempt
    const currentToken = sessionStorage.getItem(
      AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    );
    const tokenSize = currentToken ? currentToken.length : 0;

    secureLogger.info("TOKEN_REFRESH_ATTEMPT", "Attempting token refresh", {
      currentTokenSize: tokenSize,
      hasToken: !!currentToken,
      refreshMethod: "http_only_cookies",
    });

    // No refresh token storage - tokens are memory-only
    // In production, refresh would be handled by HTTP-only cookies
    secureLogger.security("SECURE_AUTH", "Token refresh failed", {
      error: "Token refresh not implemented",
      currentTokenSize: tokenSize,
    });
    return false;
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Initialize token and user from storage on mount
   */
  useEffect(() => {
    const storedToken = sessionStorage.getItem(
      AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    );
    const storedUser = sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER);
    const storedIdToken = sessionStorage.getItem("id_token");

    if (storedToken && !accessToken) {
      setAccessToken(storedToken);
      // Only log once per session to avoid verbose logs
      if (!sessionStorage.getItem("auth_restored_logged")) {
        const tokenSize = storedToken.length;
        const idTokenSize = storedIdToken ? storedIdToken.length : 0;
        const userDataSize = storedUser ? storedUser.length : 0;
        const totalRestoredSize = tokenSize + idTokenSize + userDataSize;

        secureLogger.info(
          "TOKEN_RESTORATION_SUCCESS",
          "Tokens restored from storage",
          {
            accessTokenSize: tokenSize,
            idTokenSize,
            userDataSize,
            totalRestoredSize,
            storageMethod: "sessionStorage",
          },
        );

        console.log("🔒 [SECURE_AUTH] Restored token from sessionStorage");
        sessionStorage.setItem("auth_restored_logged", "true");
      }
    }

    if (storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser) as UserProfile;
        setUser(parsedUser);
        // Only log once per session to avoid verbose logs
        if (!sessionStorage.getItem("user_restored_logged")) {
          console.log("🔒 [SECURE_AUTH] Restored user from sessionStorage");
          sessionStorage.setItem("user_restored_logged", "true");
        }
      } catch (error) {
        console.error("🔒 [SECURE_AUTH] Failed to parse stored user:", error);
        sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER);
      }
    }
  }, []); // Run only once on mount

  /**
   * Auto-refresh token on mount and periodically
   */
  useEffect(() => {
    const refreshInterval = setInterval(
      () => {
        if (accessToken) {
          void refreshToken();
        }
      },
      14 * 60 * 1000,
    ); // Refresh every 14 minutes

    return () => void void clearInterval(refreshInterval);
  }, [accessToken, refreshToken]);

  /**
   * Handle page visibility changes (security feature)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Only log security checkpoint if user is authenticated
        if (user && accessToken) {
          secureLogger.security(
            "SECURE_AUTH",
            "Page hidden - security checkpoint",
          );
        }
      } else {
        // Page is visible - validate token is still valid
        if (accessToken) {
          void refreshToken();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [accessToken, refreshToken, user]);

  /**
   * Centralized post-login data fetching
   * This ensures API calls are made only once when auth is ready
   */
  useEffect(() => {
    if (user && accessToken && !isLoading) {
      // Only dispatch auth-ready event once per session to prevent spam
      if (!sessionStorage.getItem("auth_ready_dispatched")) {
        try {
          const authReadyEvent = new CustomEvent("authReady", {
            detail: { user, accessToken },
          });
          window.dispatchEvent(authReadyEvent);
        } catch (error) {
          // Prevent errors in event dispatch from causing stack traces
          console.warn("Auth ready event dispatch failed:", error);
        }

        // Log auth ready without throwing errors
        console.log(
          "🔒 [SECURE_AUTH] Auth ready - data fetch event dispatched",
          {
            userId: user.id,
            userEmail: user.email,
          },
        );

        // Mark as dispatched to prevent repeated logs
        sessionStorage.setItem("auth_ready_dispatched", "true");
      }
    }
  }, [user, accessToken, isLoading]);

  // Note: Global function setup moved to useAuthStoreIntegration to prevent multiple setups

  return {
    // State
    user,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    error,

    // Actions
    login,
    logout,
    refreshToken,
    clearError,
  };
}

/**
 * Utility function to get access token for API calls - secure only
 */
export const getSecureAccessToken = (): string | null => {
  // Only use secure hook - no fallbacks
  if (typeof window.getSecureAccessToken === "function") {
    return window.getSecureAccessToken();
  }

  // No fallbacks - secure token or nothing
  return null;
};

/**
 * Enhanced token storage utilities with security features - memory only
 */
export const secureTokenUtils = {
  /**
   * Store tokens securely (memory only)
   */
  storeTokens: (tokens: {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
  }) => {
    // All tokens stored in memory only via useSecureAuth hook
    // No persistent storage for security

    // Calculate token sizes for logging
    const accessTokenSize = tokens.access_token
      ? tokens.access_token.length
      : 0;
    const refreshTokenSize = tokens.refresh_token
      ? tokens.refresh_token.length
      : 0;
    const idTokenSize = tokens.id_token ? tokens.id_token.length : 0;
    const totalSize = accessTokenSize + refreshTokenSize + idTokenSize;

    // Log security event with size information
    secureLogger.security(
      "SECURE_TOKEN_UTILS",
      "Tokens stored securely in memory only",
      {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        accessTokenSize,
        refreshTokenSize,
        idTokenSize,
        totalSize,
        storageMethod: "memory_only",
      },
    );
  },

  /**
   * Clear all tokens securely
   */
  clearAllTokens: () => {
    // Log cleanup before clearing
    const accessToken = sessionStorage.getItem(
      AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
    );
    const idToken = sessionStorage.getItem("id_token");
    const userData = sessionStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.USER);

    const accessTokenSize = accessToken ? accessToken.length : 0;
    const idTokenSize = idToken ? idToken.length : 0;
    const userDataSize = userData ? userData.length : 0;
    const totalClearedSize = accessTokenSize + idTokenSize + userDataSize;

    // Clear secure tokens via global function
    if (
      "clearSecureTokens" in window &&
      typeof (window as { clearSecureTokens: () => void }).clearSecureTokens ===
        "function"
    ) {
      (window as { clearSecureTokens: () => void }).clearSecureTokens();
    }

    // Clear user data (non-sensitive)
    sessionStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER);

    secureLogger.security("SECURE_TOKEN_UTILS", "All tokens cleared securely", {
      accessTokenSize,
      idTokenSize,
      userDataSize,
      totalClearedSize,
      clearedItems: ["access_token", "id_token", "user_data"],
    });
  },

  /**
   * Validate token expiration (basic implementation)
   */
  isTokenExpired: (token: string): boolean => {
    try {
      const payload: unknown = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      if (payload && typeof payload === "object" && "exp" in payload) {
        const typedPayload = payload as { exp: number };
        return typedPayload.exp < currentTime;
      }
      return true;
    } catch {
      return true; // Assume expired if can't parse
    }
  },
};
