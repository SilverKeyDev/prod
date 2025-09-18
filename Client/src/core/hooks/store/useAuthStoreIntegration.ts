import { useEffect, useRef } from 'react';

import { useAuthStore } from '../../store/auth.slice';
import { useSecureAuth } from '../data/useSecureAuth';

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

  // Handle auth state changes with immediate updates for critical operations
  useEffect(() => {
    // For logout operations (user becoming null or unauthenticated), update immediately
    const isLogoutOperation = authUser === null && lastUserRef.current !== null;
    const isAuthStateChange = authIsAuthenticated !== lastIsAuthenticatedRef.current;
    
    const updateStore = () => {
      // Only update store if values have actually changed
      if (lastUserRef.current !== authUser) {
        lastUserRef.current = authUser;
        setUser(authUser);
      }

      if (lastIsAuthenticatedRef.current !== authIsAuthenticated) {
        const previousAuth = lastIsAuthenticatedRef.current;
        lastIsAuthenticatedRef.current = authIsAuthenticated;
        setIsAuthenticated(authIsAuthenticated);
        
        // Update auth status based on authentication state
        if (authIsAuthenticated) {
          setAuthStatus('authenticated');
        } else if (previousAuth !== undefined) {
          // Only set to unauthenticated if we had a previous state (not initial)
          setAuthStatus('unauthenticated');
        }
      }

      if (lastIsLoadingRef.current !== authIsLoading) {
        lastIsLoadingRef.current = authIsLoading;
        setIsLoading(authIsLoading);
      }

      if (lastErrorRef.current !== authError) {
        lastErrorRef.current = authError;
        setError(authError);
      }
    };

    // For logout operations or auth state changes, update immediately
    if (isLogoutOperation || isAuthStateChange) {
      updateStore();
    } else {
      // For other changes, use debounce to prevent rapid oscillations
      const timeoutId = setTimeout(updateStore, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [authUser, authIsAuthenticated, authIsLoading, authError, setUser, setIsAuthenticated, setIsLoading, setError]);

  // Auth bootstrap is now handled by AuthBootstrap component
  // This hook just syncs the secure auth state with the store

  // Set up global functions for API integration (run only once)
  useEffect(() => {
    // Guard against multiple setups
    if (window.getSecureAccessToken) {
      return; // Already set up
    }

    // Create a stable function that always returns the current token from sessionStorage
    window.getSecureAccessToken = () => {
      return sessionStorage.getItem('access_token');
    };
    
    // Create stable logout function that doesn't depend on React state
    window.secureLogout = () => {
      console.log('🔒 [SECURE_AUTH] Logout initiated');
      
      // Clear all storage
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('signupEmail');
      
      // Navigate to login
      window.location.href = '/login';
    };
    
    window.clearSecureTokens = () => {
      sessionStorage.removeItem('access_token');
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
