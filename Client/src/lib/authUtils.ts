/* =========================
   Auth State Management
   ========================= */

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { NavigateFunction } from "react-router-dom";
import {
  fetchJson,
  logHttp,
  createAuthHeaders,
  isAuthenticationError,
  handleAuthenticationError,
} from "../api/utils/index";

export interface AuthState {
  user: any | null;
  authReady: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to manage authentication state with proper readiness tracking
 */
export function useAuthState(): AuthState {
  const [user, setUser] = useState<any | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const didRun = useRef(false);

  // Use centralized localStorage hooks for token management
  const { value: idToken, removeValue: removeIdToken } = useLocalStorage<
    string | null
  >("id_token", null);
  const { removeValue: removeAccessToken } = useLocalStorage<string | null>(
    "access_token",
    null,
  );

  const checkAuth = useCallback(async () => {
    // Check for tokens in multiple locations (secure auth, sessionStorage, localStorage)
    const secureToken = (window as any).getSecureAccessToken?.();
    const sessionToken = sessionStorage.getItem("access_token");
    const activeToken = secureToken || sessionToken || idToken;

    console.log(
      "🔒 [AUTH] Checking authentication - secureToken:",
      !!secureToken,
      "sessionToken:",
      !!sessionToken,
      "idToken:",
      !!idToken,
    );

    if (!activeToken) {
      console.log("🔒 [AUTH] No token found, setting user to null");
      setUser(null);
      setAuthReady(true);
      return;
    }

    try {
      // Verify token with backend
      console.log("🔒 [AUTH] Verifying token with backend...");
      const response = await fetchJson<any>("/api/v1/user/profile", {
        headers: createAuthHeaders(activeToken),
        acceptStatuses: [401, 404], // Treat these as "not authenticated"
      });

      if (response?.success && response?.data) {
        console.log(
          "🔒 [AUTH] Token valid, user authenticated:",
          response.data.email || "unknown",
        );
        setUser(response.data);
      } else {
        console.log("🔒 [AUTH] Invalid token response, clearing tokens");
        // Invalid token, clear it
        removeIdToken();
        removeAccessToken();
        setUser(null);
      }
    } catch (error) {
      if (isAuthenticationError(error)) {
        console.log("🔒 [AUTH] Authentication error, handling redirect");
        handleAuthenticationError(error as any);
        return; // User will be redirected
      }
      console.log("🔒 [AUTH] Error during token verification:", error);
      logHttp("auth", error);
      // On error, assume not authenticated but don't clear tokens aggressively
      // This prevents StrictMode double-mount from clearing valid tokens
      setUser(null);
    } finally {
      setAuthReady(true);
      console.log("🔒 [AUTH] Authentication check complete");
    }
  }, [idToken, removeIdToken, removeAccessToken]);

  // Listen for auth changes from secure auth system
  useEffect(() => {
    const handleAuthChange = () => {
      console.log("🔒 [AUTH] Auth change detected, refreshing auth state");
      setRefreshTrigger((prev) => prev + 1);
    };

    // Listen for custom auth events
    window.addEventListener("authChange", handleAuthChange);

    return () => {
      window.removeEventListener("authChange", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    // StrictMode guard - prevent double execution in development
    if (import.meta.env.DEV && didRun.current && refreshTrigger === 0) {
      console.log(
        "🔒 [AUTH] Skipping duplicate auth check due to StrictMode double-mount",
      );
      return;
    }
    didRun.current = true;

    console.log(
      "🔒 [AUTH] Initializing authentication check (trigger:",
      refreshTrigger,
      ")",
    );
    checkAuth();
  }, [checkAuth, refreshTrigger]);

  // Note: Cross-tab storage synchronization is handled automatically by useLocalStorage hooks
  // No manual storage event listener needed

  return {
    user,
    authReady,
    isAuthenticated: !!user,
  };
}

/* =========================
   Auth Utility Functions
   ========================= */

/**
 * Checks if user has valid auth tokens and redirects to login if not
 * @param navigate - React Router navigate function
 * @returns true if tokens exist, false if redirected to login
 */
export const checkAuthAndRedirect = (navigate: NavigateFunction): boolean => {
  // Check for user in localStorage (App.tsx authentication pattern)
  const user = localStorage.getItem("user");
  if (user) {
    return true;
  }

  // Check secure auth hook tokens
  if ((window as any).getSecureAccessToken) {
    const secureToken = (window as any).getSecureAccessToken();
    if (secureToken) {
      return true;
    }
  }

  // Check sessionStorage access token (fallback)
  const sessionToken = sessionStorage.getItem("access_token");
  if (sessionToken) {
    return true;
  }

  // Legacy token check (for backward compatibility)
  const idToken = localStorage.getItem("id_token");
  const token = localStorage.getItem("token");
  const authToken = idToken || token;

  if (authToken) {
    return true;
  }

  navigate("/login");
  return false;
};

/**
 * Gets auth token from localStorage
 * @returns auth token or null if not found
 */
export const getAuthToken = (): string | null => {
  // Try secure auth hook first
  if ((window as any).getSecureAccessToken) {
    const secureToken = (window as any).getSecureAccessToken();
    if (secureToken) return secureToken;
  }

  // Try sessionStorage access token
  const sessionToken = sessionStorage.getItem("access_token");
  if (sessionToken) return sessionToken;

  // Legacy fallback
  const idToken = localStorage.getItem("id_token");
  const token = localStorage.getItem("token");
  return idToken || token;
};

/**
 * Clears all auth tokens from localStorage
 */
export const clearAuthTokens = (): void => {
  // Clear secure auth hook tokens
  if ((window as any).clearSecureTokens) {
    (window as any).clearSecureTokens();
  }

  // Clear all possible token storage locations
  localStorage.removeItem("id_token");
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("refresh_token");
};
