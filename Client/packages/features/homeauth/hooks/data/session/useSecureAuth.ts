/**
 * Secure Authentication Hook
 * Implements secure token storage with memory-based access tokens and HTTP-only refresh tokens
 */

import { useCallback, useRef, useState } from "react";

import { type AuthState, useAuthStore } from "packages/store";
import { type UserState, useUserStore } from "packages/store";

import type { UserProfile } from "@/features/homeauth/types";

import type { UseSecureAuthReturn } from "./types";
import {
  useAuthReadyDispatch,
  useProactiveTokenRefresh,
  useVisibilityRefresh,
} from "./useSecureAuthEffects";
import { performLogin, performLogout, performRefreshToken } from "./useSecureAuthFlows";

export type { UseSecureAuthReturn };
export {
  getSecureAccessToken,
  secureTokenUtils,
} from "packages/features/homeauth/hooks/data/utils/secureTokenUtils";

export function useSecureAuth(): UseSecureAuthReturn {
  const storeUser = useAuthStore((s: AuthState) => s.user);
  const storeIsAuthenticated = useAuthStore((s: AuthState) => s.isAuthenticated);
  const [user, setUser] = useState<UserProfile | null>(storeUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(
    storeIsAuthenticated ? "authenticated" : null
  );
  const isLoggingInRef = useRef(false);
  const setStoreUser = useAuthStore((s: AuthState) => s.setUser);
  const setStoreIsAuthenticated = useAuthStore((s: AuthState) => s.setIsAuthenticated);
  const setStoreAuthStatus = useAuthStore((s: AuthState) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s: AuthState) => s.setAuthReady);
  const setStorePostAuthRedirectPath = useAuthStore((s: AuthState) => s.setPostAuthRedirectPath);
  const setUserProfile = useUserStore((s: UserState) => s.setUserProfile);

  const login = useCallback(
    (email: string, password: string) =>
      performLogin(email, password, {
        setUser,
        setError,
        setNeedsVerification,
        setAccessToken,
        setIsLoading,
        setStoreUser,
        setStoreIsAuthenticated,
        setStoreAuthStatus,
        setStoreAuthReady,
        setStorePostAuthRedirectPath,
        setUserProfile,
        setLoginRef: (v) => {
          isLoggingInRef.current = v;
        },
      }),
    [
      setStoreUser,
      setStoreIsAuthenticated,
      setStoreAuthStatus,
      setStoreAuthReady,
      setStorePostAuthRedirectPath,
      setUserProfile,
    ]
  );
  const logout = useCallback(
    () =>
      performLogout({
        setAccessToken,
        setUser,
        setStoreUser,
        setStoreIsAuthenticated,
        setStoreAuthStatus,
        setStoreAuthReady,
        setStorePostAuthRedirectPath,
        setUserProfile,
      }),
    [
      setStoreUser,
      setStoreIsAuthenticated,
      setStoreAuthStatus,
      setStoreAuthReady,
      setStorePostAuthRedirectPath,
      setUserProfile,
    ]
  );
  const refreshToken = useCallback(
    () =>
      performRefreshToken({
        setAccessToken,
        setUser,
        setStoreUser,
        setStoreIsAuthenticated,
        setStoreAuthStatus,
        currentUser: user,
      }),
    [setAccessToken, setUser, setStoreUser, setStoreIsAuthenticated, setStoreAuthStatus, user]
  );
  const clearError = useCallback(() => {
    setError(null);
    setNeedsVerification(false);
  }, []);

  useProactiveTokenRefresh(accessToken, user, refreshToken);
  useVisibilityRefresh(accessToken, refreshToken, user);
  useAuthReadyDispatch(user, accessToken, isLoading);

  return {
    user,
    isAuthenticated: !!accessToken,
    isLoading,
    error,
    needsVerification,
    login,
    logout,
    refreshToken,
    clearError,
  };
}
