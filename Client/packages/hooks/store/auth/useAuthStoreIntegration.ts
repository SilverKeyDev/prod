import { useEffect, useRef } from "react";

import { useAuthStore } from "../../../store/auth.slice";
import { useSecureAuth } from "../../data/auth/useSecureAuth";

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

  // Sync hook data with store (guard against redundant updates)
  const lastUserRef = useRef<typeof authUser>();
  const lastIsAuthenticatedRef = useRef<typeof authIsAuthenticated>();
  const lastIsLoadingRef = useRef<typeof authIsLoading>();
  const lastErrorRef = useRef<typeof authError>();

  // Sync auth state with store - optimized to prevent excessive re-renders
  // This effect syncs useSecureAuth state to the Zustand store
  useEffect(() => {
    // Only update store if values have actually changed (use refs to track)
    if (lastUserRef.current !== authUser) {
      lastUserRef.current = authUser;
      setUser(authUser);
    }

    if (lastIsAuthenticatedRef.current !== authIsAuthenticated) {
      lastIsAuthenticatedRef.current = authIsAuthenticated;
      setIsAuthenticated(authIsAuthenticated);

      // Update auth status based on authentication state
      // Only update if transitioning TO authenticated
      // Never downgrade from authenticated to unauthenticated here
      // (logout should explicitly call setAuthStatus)
      if (authIsAuthenticated) {
        setAuthStatus("authenticated");
      }
      // Note: Don't set to unauthenticated here - it creates race conditions
      // Auth status should only be set to unauthenticated by:
      // 1. Initial bootstrap (AuthProvider)
      // 2. Explicit logout action
    }

    if (lastIsLoadingRef.current !== authIsLoading) {
      lastIsLoadingRef.current = authIsLoading;
      setIsLoading(authIsLoading);
    }

    if (lastErrorRef.current !== authError) {
      lastErrorRef.current = authError;
      setError(authError);
    }
    // Zustand setters are stable references and don't need to be in dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, authIsAuthenticated, authIsLoading, authError]);

  // Don't set authReady immediately - let useSecureAuth control when it's ready
  // This prevents premature re-renders before auth state is fully initialized

  // Auth bootstrap is now handled by AuthBootstrap component
  // This hook just syncs the secure auth state with the store

  // Set up global functions for API integration (run only once)
  useEffect(() => {
    // Guard against multiple setups
    if (window.getSecureAccessToken) {
      return; // Already set up
    }

    // HTTP-only cookies: Always return null so Authorization header is NOT set
    // Browser automatically sends the session cookie with credentials: "include"
    window.getSecureAccessToken = () => {
      return null;
    };

    // Create stable logout function that doesn't depend on React state
    window.secureLogout = () => {
      // Clear user data from storage (tokens are in HTTP-only cookies)
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("signupEmail");

      // Navigate to login (backend will clear HTTP-only cookies via /logout endpoint)
      window.location.href = "/login";
    };

    // HTTP-only cookies: No client-side token clearing needed
    // Tokens can only be cleared by the server via Set-Cookie with max_age=0
    window.clearSecureTokens = () => {
      // No-op: tokens are in HTTP-only cookies, not accessible to JS
      // Commented out debug log to avoid linting warnings
      // console.debug("HTTP-only cookies cannot be cleared client-side");
    };

    return () => {
      // Only cleanup if this is the last instance
      if (window.getSecureAccessToken) {
        delete window.getSecureAccessToken;
        delete window.secureLogout;
        delete window.clearSecureTokens;
      }
    };
  }, []); // Run only once on mount

  // Override the store's placeholder methods with real implementations
  useEffect(() => {
    const store = useAuthStore.getState();
    // Replace the placeholder methods with real implementations
    store.login = authLogin;
    store.logout = authLogout;
    store.refreshToken = authRefreshToken;
  }, [authLogin, authLogout, authRefreshToken]);

  // Note: Removed storage event handler to prevent page reload conflicts
  // Cross-tab auth changes are handled by the session timeout hook

  // Note: Removed authChange event handler to prevent page reload conflicts
  // Auth state changes are now handled reactively through the hook state

  return {
    // State
    user: authUser,
    isAuthenticated: authIsAuthenticated,
    isLoading: authIsLoading,
    error: authError,
    authReady: storeAuthReady,
    authStatus: storeAuthStatus,

    // Actions
    login: authLogin,
    logout: authLogout,
    refreshToken: authRefreshToken,
    clearError: () => {
      authClearError();
      storeClearError();
    },
  };
}
