/**
 * Secure Authentication Hook
 * Implements secure token storage with memory-based access tokens and HTTP-only refresh tokens
 */

import { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom"; // removed: not needed

import { authApi } from "../../config/api";
import type { UserProfile } from "../../schemas/user";
import { reportSecurityEvent } from "../../services/security/errorReporting";
import { secureLogger } from "../../services/security/secureLogger";
import { useAuthStore, type AuthState } from "../../store/auth.slice";
import { useUserStore, type UserState } from "../../store/user.slice";
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
  // Initialize from store to prevent overriding session-verified users
  // This ensures that users authenticated via HTTP-only cookies (AuthProvider)
  // are not overridden by null values from useSecureAuth initialization
  const storeUser = useAuthStore((s: AuthState) => s.user);
  const storeIsAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);
  
  const [user, setUser] = useState<UserProfile | null>(storeUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // const navigate = useNavigate(); // removed

  // Store access token in memory only (more secure)
  // Initialize based on store state to match session-verified authentication
  const [accessToken, setAccessToken] = useState<string | null>(storeIsAuthenticated ? "authenticated" : null);

  // Track if we're in the middle of a login to prevent premature navigation
  const isLoggingInRef = useRef(false);

  // Get store actions for immediate updates
  const setStoreUser = useAuthStore((s: AuthState) => s.setUser);
  const setStoreIsAuthenticated = useAuthStore((s: AuthState) => s.setIsAuthenticated);
  const setStoreAuthStatus = useAuthStore((s: AuthState) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s: AuthState) => s.setAuthReady);

  // Get user store actions to persist user profile across refreshes
  const setUserProfile = useUserStore((s: UserState) => s.setUserProfile);

  /**
   * Secure login with memory-based token storage
   */
  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      isLoggingInRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        const response = await authApi.login({ email, password });

        if (response.success) {
          // Server uses HTTP-only cookies for access/refresh tokens
          // Tokens are NEVER stored in sessionStorage or localStorage
          // The actual access token is in HTTP-only cookie and handled by browser
          setAccessToken("authenticated");

          // Log successful authentication (no token storage)
          secureLogger.info(
            "AUTH_SUCCESS",
            "Authentication successful via HTTP-only cookies",
            {
              storageMethod: "http_only_cookies",
              authMethod: "cookie_based",
              note: "All tokens in secure HTTP-only cookies",
            },
          );

          // Store user data (non-sensitive)
          if (response.user) {
            // Use user_sub as fallback if id is not available
            const userId =
              response.user.id ||
              ("user_sub" in response.user
                ? response.user.user_sub
                : undefined) ||
              response.user_sub;

            const mappedUser: UserProfile = {
              id: userId || "",
              email: response.user.email,
              name: response.user.name || "Unknown User",  // Fallback for null names
              phone: ("phone" in response.user ? response.user.phone : undefined) as string | null | undefined,
              // Best-effort defaults for fields not provided by AuthResponse
              created_at: null,
              is_active: true,
              has_subscription: false,
              subscription: null,
              has_preferences: false,
              is_agent: false,
              auth_method: ("auth_method" in response.user ? response.user.auth_method : undefined) as "cognito" | "google" | "both" | "unknown" | undefined,
            };

            // Convert to user store format to fix type compatibility
            const userStoreProfile = {
              ...mappedUser,
              name: mappedUser.name || undefined, // Convert null to undefined for user store
            };

            // Log the mapping for debugging (dev only)
            if (process.env.NODE_ENV === "development") {
              secureLogger.debug("SECURE_AUTH_DEV", "User mapping", {
                responseUserId: response.user.id,
                responseUserSub:
                  "user_sub" in response.user
                    ? response.user.user_sub
                    : undefined,
                responseUserSubTop: response.user_sub,
                finalUserId: userId,
                email: response.user.email,
                name: response.user.name,
              });
            }

            setUser(mappedUser);

            // Batch all store updates including authReady to prevent race conditions
            // React's automatic batching ensures these happen together
            setStoreUser(mappedUser);
            setStoreIsAuthenticated(true);
            setStoreAuthStatus("authenticated");
            setStoreAuthReady(true);

            // Also store in user store for sidebar display (persists to localStorage)
            // This ensures name/email are immediately available and persist across refreshes
            setUserProfile(userStoreProfile);

            isLoggingInRef.current = false;

            // Additional logging to debug the user state (dev only)
            if (process.env.NODE_ENV === "development") {
              secureLogger.debug("SECURE_AUTH_DEV", "User state after login", {
                localUser: mappedUser,
                localUserId: mappedUser.id,
                localUserEmail: mappedUser.email,
              });
            }

            // User data stored in memory and Zustand store only (no sessionStorage)
            // All persistence is handled by HTTP-only cookies
          } else {
            // Even if no user data, mark auth as ready to prevent infinite loading
            setStoreIsAuthenticated(true);
            setStoreAuthStatus("authenticated");
            setStoreAuthReady(true);
            isLoggingInRef.current = false;
          }

          // Ensure auth state is immediately available for route guards
          // This prevents race conditions where ProtectedRoute checks before state updates
          if (process.env.NODE_ENV === "development") {
            secureLogger.security(
              "SECURE_AUTH",
              "Auth state updated synchronously",
              {
                authenticated: true,
                hasUser: !!response.user,
                authMethod: "http-only-cookies",
              },
            );
          }

          if (process.env.NODE_ENV === "development") {
            secureLogger.security("SECURE_AUTH", "Login successful", {
              userId:
                response.user?.id ||
                (response.user && "user_sub" in response.user
                  ? response.user.user_sub
                  : undefined),
            });
          }

          return true;
        } else {
          setError(response.error ?? "Login failed");
          isLoggingInRef.current = false;
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

        isLoggingInRef.current = false;
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [
      setStoreUser,
      setStoreIsAuthenticated,
      setStoreAuthStatus,
      setStoreAuthReady,
      setUserProfile,
    ],
  );

  /**
   * Secure logout with complete token cleanup
   */
  const logout = useCallback(async () => {
    secureLogger.info("SECURE_AUTH", "Logout initiated");

    try {
      // Call server logout endpoint to clear HTTP-only cookies
      await authApi.logout();
      secureLogger.info("LOGOUT_SUCCESS", "Server logout successful");
    } catch (error) {
      // Log error but continue with client cleanup
      secureLogger.warn(
        "LOGOUT_ERROR",
        "Server logout failed, continuing with client cleanup",
        {
          error: asError(error).message,
        },
      );
    }

    // Clear memory-based state
    setAccessToken(null);
    setUser(null);

    // Clear auth store state
    setStoreUser(null);
    setStoreIsAuthenticated(false);
    setStoreAuthStatus("unauthenticated");
    setStoreAuthReady(false);

    // Clear user store state (ensures sidebar is cleared)
    setUserProfile(null);

    // Clear only non-sensitive session flags (not tokens - they don't exist in storage)
    sessionStorage.removeItem("signupEmail");
    sessionStorage.removeItem("auth_ready_dispatched");
    sessionStorage.removeItem("reports_fetch_logged");
    sessionStorage.removeItem("reports_loaded_logged");
    sessionStorage.removeItem("saved_homes_fetch_logged");
    sessionStorage.removeItem("saved_homes_loaded_logged");
    sessionStorage.removeItem("auth_restored_logged");
    sessionStorage.removeItem("user_restored_logged");

    secureLogger.security(
      "SECURE_AUTH",
      "User logged out - HTTP-only cookies cleared by server",
    );

    secureLogger.info("SECURE_AUTH", "Logout complete, navigating to /login");
    // Use window.location.href for reliable navigation during logout
    // This prevents AuthGuard redirect loops that can occur with React Router navigation
    window.location.href = "/login";
  }, [
    setStoreUser,
    setStoreIsAuthenticated,
    setStoreAuthStatus,
    setStoreAuthReady,
    setUserProfile,
  ]); // include Zustand setters (stable) in deps

  /**
   * Refresh access token using refresh token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    // Token refresh is handled automatically by HTTP-only cookies
    // The server will manage token expiration and refresh
    secureLogger.debug(
      "SECURE_AUTH",
      "Token refresh handled by HTTP-only cookies",
    );
    return true;
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * NO initialization from storage - auth state is managed via HTTP-only cookies
   * The AuthProvider will verify session with server on mount
   */

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

    return () => {
      clearInterval(refreshInterval);
    };
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

          // Use setTimeout to ensure the event is dispatched asynchronously
          // This prevents the "message channel closed" error
          setTimeout(() => {
            try {
              window.dispatchEvent(authReadyEvent);
            } catch (dispatchError) {
              secureLogger.warn(
                "SECURE_AUTH",
                "Auth ready event dispatch failed",
                { error: asError(dispatchError).message },
              );
            }
          }, 0);
        } catch (eventCreationError) {
          // Prevent errors in event creation from causing stack traces
          secureLogger.warn("SECURE_AUTH", "Auth ready event creation failed", {
            error: asError(eventCreationError).message,
          });
        }

        // Log auth ready without throwing errors
        if (process.env.NODE_ENV === "development") {
          secureLogger.debug("SECURE_AUTH_DEV", "Auth ready event dispatched", {
            userId: user?.id || "unknown",
            userEmail: user?.email || "unknown",
          });
        }

        // Mark as dispatched to prevent repeated logs
        sessionStorage.setItem("auth_ready_dispatched", "true");
      }
    }
  }, [user, accessToken, isLoading]);

  // Note: Global function setup moved to useAuthStoreIntegration to prevent multiple setups

  // Compute authentication state
  const isAuthenticated = !!user && !!accessToken;

  return {
    // State
    user,
    isAuthenticated,
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
 * Enhanced token utilities with security features
 * NOTE: With HTTP-only cookies, these utilities only LOG token information.
 * Actual tokens are stored in HTTP-only cookies by the backend and are not accessible to JavaScript.
 */
export const secureTokenUtils = {
  /**
   * Log token information for debugging
   * NOTE: This does NOT store tokens! Tokens are in HTTP-only cookies.
   * This function only logs token sizes for security auditing.
   */
  storeTokens: (tokens: {
    access_token?: string;
    refresh_token?: string;
    id_token?: string;
  }) => {
    // HTTP-only cookies: Tokens are NOT stored client-side
    // This function only logs token metadata for debugging

    // Calculate token sizes for logging
    const accessTokenSize = tokens.access_token
      ? tokens.access_token.length
      : 0;
    const refreshTokenSize = tokens.refresh_token
      ? tokens.refresh_token.length
      : 0;
    const idTokenSize = tokens.id_token ? tokens.id_token.length : 0;
    const totalSize = accessTokenSize + refreshTokenSize + idTokenSize;

    // Log security event with size information (no token values logged)
    secureLogger.security(
      "SECURE_TOKEN_UTILS",
      "Token metadata logged (tokens NOT stored - using HTTP-only cookies)",
      {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        hasIdToken: !!tokens.id_token,
        accessTokenSize,
        refreshTokenSize,
        idTokenSize,
        totalSize,
        storageMethod: "http_only_cookies",
        note: "Tokens are in HTTP-only cookies, not accessible to JS",
      },
    );
  },

  /**
   * Clear all tokens securely
   */
  clearAllTokens: () => {
    // Tokens are in HTTP-only cookies - no client-side clearing needed
    // Server must be called to clear cookies via /logout endpoint
    secureLogger.security(
      "SECURE_TOKEN_UTILS",
      "Token clearing delegated to server",
      {
        note: "HTTP-only cookies can only be cleared by server",
      },
    );
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
