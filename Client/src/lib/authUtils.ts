/* =========================
   Auth State Management
   ========================= */

import { useState, useEffect, useCallback } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { fetchJson, logHttp, createAuthHeaders, isAuthenticationError, handleAuthenticationError } from './fetchUtils';

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

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('id_token');
    
    if (!token) {
      setUser(null);
      setAuthReady(true);
      return;
    }

    try {
      // Verify token with backend
      const response = await fetchJson<any>('/api/v1/user/profile', {
        headers: createAuthHeaders(token),
        acceptStatuses: [401, 404], // Treat these as "not authenticated"
      });

      if (response?.success && response?.data) {
        setUser(response.data);
      } else {
        // Invalid token, clear it
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } catch (error) {
      if (isAuthenticationError(error)) {
        handleAuthenticationError(error as any);
        return; // User will be redirected
      }
      logHttp('auth', error);
      // On error, assume not authenticated
      localStorage.removeItem('id_token');
      localStorage.removeItem('access_token');
      setUser(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Listen for storage changes (cross-tab auth)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'id_token') {
        if (e.newValue) {
          checkAuth();
        } else {
          setUser(null);
          setAuthReady(true);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuth]);

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
  const idToken = localStorage.getItem("id_token");
  const token = localStorage.getItem("token");
  const authToken = idToken || token;

  if (!authToken) {
    navigate("/login");
    return false;
  }

  return true;
};

/**
 * Gets auth token from localStorage
 * @returns auth token or null if not found
 */
export const getAuthToken = (): string | null => {
  const idToken = localStorage.getItem("id_token");
  const token = localStorage.getItem("token");
  return idToken || token;
};

/**
 * Clears all auth tokens from localStorage
 */
export const clearAuthTokens = (): void => {
  localStorage.removeItem("id_token");
  localStorage.removeItem("token");
  localStorage.removeItem("access_token");
};
