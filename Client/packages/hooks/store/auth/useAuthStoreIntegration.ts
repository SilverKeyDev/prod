import { useEffect, useRef } from "react";

import { useSecureAuth } from "packages/hooks/data/auth/useSecureAuth";
import { getSessionStorage } from "packages/hooks/data/auth/utils/logoutCleanup";
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

  const {
    authReady: storeAuthReady,
    authStatus: storeAuthStatus,
    setUser,
    setIsAuthenticated,
    setIsLoading,
    setError,
    setAuthStatus,
    clearError: storeClearError,
  } = useAuthStore();

  const lastUserRef = useRef<typeof authUser>();
  const lastIsAuthenticatedRef = useRef<typeof authIsAuthenticated>();
  const lastIsLoadingRef = useRef<typeof authIsLoading>();
  const lastErrorRef = useRef<typeof authError>();

  useEffect(() => {
    if (lastUserRef.current !== authUser) {
      lastUserRef.current = authUser;
      setUser(authUser);
    }
    if (lastIsAuthenticatedRef.current !== authIsAuthenticated) {
      lastIsAuthenticatedRef.current = authIsAuthenticated;
      setIsAuthenticated(authIsAuthenticated);
      if (authIsAuthenticated) setAuthStatus("authenticated");
    }
    if (lastIsLoadingRef.current !== authIsLoading) {
      lastIsLoadingRef.current = authIsLoading;
      setIsLoading(authIsLoading);
    }
    if (lastErrorRef.current !== authError) {
      lastErrorRef.current = authError;
      setError(authError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authIsAuthenticated, authIsLoading, authError]);

  useEffect(() => {
    return setupSecureAccessTokenOnWindow();
  }, []);

  useEffect(() => {
    const store = useAuthStore.getState();
    store.login = authLogin;
    store.logout = authLogout;
    store.refreshToken = authRefreshToken;
  }, [authLogin, authLogout, authRefreshToken]);

  return {
    user: authUser,
    isAuthenticated: authIsAuthenticated,
    isLoading: authIsLoading,
    error: authError,
    authReady: storeAuthReady,
    authStatus: storeAuthStatus,
    login: authLogin,
    logout: authLogout,
    refreshToken: authRefreshToken,
    clearError: () => {
      authClearError();
      storeClearError();
    },
  };
}
