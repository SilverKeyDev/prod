import { useCallback, useEffect, useRef } from "react";

import { useSecureAuth } from "packages/features/homeauth/hooks/data/useSecureAuth";
import { getSessionStorage } from "packages/features/homeauth/hooks/data/utils/logoutCleanup";
import { useAuthStore } from "packages/store";
import { getWindow } from "packages/utils";

function setupSecureAccessTokenOnWindow(): (() => void) | void {
  const win = getWindow();
  if (!win) return;
  const winExt = win as Window & {
    getSecureAccessToken?: () => string | null;
    secureLogout?: () => void;
    clearSecureTokens?: () => void;
  };
  if (winExt.getSecureAccessToken) return;
  winExt.getSecureAccessToken = () => null;
  winExt.secureLogout = () => {
    const sess = getSessionStorage();
    if (sess) {
      sess.removeItem("user");
      sess.removeItem("signupEmail");
      sess.removeItem("signupPassword");
    }
    const w = getWindow();
    if (w) w.location.href = "/login";
  };
  winExt.clearSecureTokens = () => {};
  return () => {
    delete winExt.getSecureAccessToken;
    delete winExt.secureLogout;
    delete winExt.clearSecureTokens;
  };
}

/**
 * Hook that integrates useSecureAuth with useAuthStore
 * This replaces the AuthProvider functionality
 */
export function useAuthStoreIntegration() {
  const {
    user: authUser,
    isAuthenticated: authIsAuthenticated,
    isLoading: authIsLoading,
    error: authError,
    login: authLogin,
    logout: authLogout,
    refreshToken: authRefreshToken,
    clearError: authClearError,
  } = useSecureAuth();

  const storeAuthReady = useAuthStore((s) => s.authReady);
  const storeAuthStatus = useAuthStore((s) => s.authStatus);
  const storeUser = useAuthStore((s) => s.user);
  const storeIsAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const storeIsLoading = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);
  const setUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setIsLoading = useAuthStore((s) => s.setIsLoading);
  const setError = useAuthStore((s) => s.setError);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const storeClearError = useAuthStore((s) => s.clearError);
  const setLogin = useAuthStore((s) => s.setLogin);
  const setLogout = useAuthStore((s) => s.setLogout);
  const setRefreshToken = useAuthStore((s) => s.setRefreshToken);

  const lastUserRef = useRef<typeof authUser>();
  const lastIsAuthenticatedRef = useRef<typeof authIsAuthenticated>();
  const lastIsLoadingRef = useRef<typeof authIsLoading>();
  const lastErrorRef = useRef<typeof authError>();

  useEffect(() => {
    if (lastUserRef.current !== authUser) {
      lastUserRef.current = authUser;
      if (storeUser !== authUser) {
        setUser(authUser);
      }
    }
    if (lastIsAuthenticatedRef.current !== authIsAuthenticated) {
      lastIsAuthenticatedRef.current = authIsAuthenticated;
      if (storeIsAuthenticated !== authIsAuthenticated) {
        setIsAuthenticated(authIsAuthenticated);
      }
      if (authIsAuthenticated && storeAuthStatus !== "authenticated") {
        setAuthStatus("authenticated");
      }
    }
    if (lastIsLoadingRef.current !== authIsLoading) {
      lastIsLoadingRef.current = authIsLoading;
      if (storeIsLoading !== authIsLoading) {
        setIsLoading(authIsLoading);
      }
    }
    if (lastErrorRef.current !== authError) {
      lastErrorRef.current = authError;
      if (storeError !== authError) {
        setError(authError);
      }
    }
    // Only run again when auth values from useSecureAuth or store actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authUser,
    authIsAuthenticated,
    authIsLoading,
    authError,
    storeUser,
    storeIsAuthenticated,
    storeIsLoading,
    storeError,
    storeAuthStatus,
  ]);

  useEffect(() => {
    return setupSecureAccessTokenOnWindow();
  }, []);

  useEffect(() => {
    setLogin(authLogin);
    setLogout(authLogout);
    setRefreshToken(authRefreshToken);
  }, [
    authLogin,
    authLogout,
    authRefreshToken,
    setLogin,
    setLogout,
    setRefreshToken,
  ]);

  // Stable logout reference so App/consumers don't re-render when useSecureAuth's ref changes
  const logoutRef = useRef(authLogout);
  logoutRef.current = authLogout;
  const stableLogout = useCallback(() => {
    void Promise.resolve(logoutRef.current?.());
  }, []);

  return {
    user: authUser,
    isAuthenticated: authIsAuthenticated,
    isLoading: authIsLoading,
    error: authError,
    authReady: storeAuthReady,
    authStatus: storeAuthStatus,
    login: authLogin,
    logout: stableLogout,
    refreshToken: authRefreshToken,
    clearError: () => {
      authClearError();
      storeClearError();
    },
  };
}
