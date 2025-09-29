/**
 * React hook for authentication state management
 * Used by AuthProvider to manage user authentication state
 */

import { useState, useEffect, useCallback } from "react";

import type { UserProfile } from "../../../../../packages/schemas/user";
import { useSessionStore } from "../../../../../packages/store";
import { hasValidAuthToken } from "../../../../../packages/utils/auth";

export type AuthState = {
  user: UserProfile | null;
  authReady: boolean;
  isAuthenticated: boolean;
};

export function useAuthState(): AuthState {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Zustand session store actions
  const setAuthReadyStore = useSessionStore((s) => s.setAuthReady);
  const setIsAuthenticatedStore = useSessionStore((s) => s.setIsAuthenticated);
  const setUserMetaStore = useSessionStore((s) => s.setUserMeta);

  const checkAuthStatus = useCallback(() => {
    const hasValidToken = hasValidAuthToken();
    setIsAuthenticated(hasValidToken);
    setIsAuthenticatedStore(hasValidToken);

    if (hasValidToken) {
      // Try to get user data from storage
      try {
        const userData =
          localStorage.getItem("user") ?? sessionStorage.getItem("user");
        if (userData) {
          const parsedUser = JSON.parse(userData) as Partial<UserProfile>;
          // Type-safe user data assignment
          const typedUser: UserProfile = {
            id: parsedUser.id ?? "",
            email: parsedUser.email ?? "",
            name: parsedUser.name ?? "",
            phone: parsedUser.phone,
            created_at: parsedUser.created_at ?? null,
            is_active: parsedUser.is_active ?? true,
            has_subscription: parsedUser.has_subscription ?? false,
            subscription: parsedUser.subscription,
            has_preferences: parsedUser.has_preferences ?? false,
            is_agent: parsedUser.is_agent ?? false,
            agent_id: parsedUser.agent_id,
            client_ids: parsedUser.client_ids,
            roles: parsedUser.roles,
          };
          setUser(typedUser);
          // Set user meta in Zustand store (non-sensitive data only)
          setUserMetaStore({
            id: typedUser.id,
            email: typedUser.email,
            name: typedUser.name,
          });
        }
      } catch (error: unknown) {
        console.warn("Error parsing user data:", error);
        setUser(null);
        setUserMetaStore(null);
      }
    } else {
      setUser(null);
      setUserMetaStore(null);
    }

    setAuthReady(true);
    setAuthReadyStore(true);
  }, [setAuthReadyStore, setIsAuthenticatedStore, setUserMetaStore]);

  const handleStorageChange = useCallback(
    (event: StorageEvent) => {
      if (event.key === "access_token" || event.key === "user") {
        checkAuthStatus();
      }
    },
    [checkAuthStatus],
  );

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === "visible") {
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

  useEffect(() => {
    // Initial auth check
    checkAuthStatus();

    // Listen for storage changes (cross-tab sync)
    window.addEventListener("storage", handleStorageChange);

    // Listen for page visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [checkAuthStatus, handleStorageChange, handleVisibilityChange]);

  return {
    user,
    authReady,
    isAuthenticated,
  };
}
