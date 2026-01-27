/**
 * Authentication Provider
 * Gates the app on deterministic bootstrap that completes before routes mount
 * Handles initial auth verification with server
 */

import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { useAuthStore } from "../../../../../packages/store/auth.slice";
import { secureLogger } from "../../../../../packages/services/security/secureLogger";
import { authUtils } from "../../../../../packages/config/auth";
import type { UserProfile } from "../../../../../packages/schemas/user";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  // Get current location to check if route is public
  const location = useLocation();

  // Get auth state directly from store
  const authReady = useAuthStore((s) => s.authReady);
  const storeAuthStatus = useAuthStore((s) => s.authStatus);
  const setStoreAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s) => s.setAuthReady);
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);

  // Initialize auth state with server verification
  useEffect(() => {
    // Guard against double bootstrap calls
    const bootstrapKey = "auth_bootstrap_started";
    if (sessionStorage.getItem(bootstrapKey)) {
      secureLogger.info(
        "🔍 FRONTEND_AUTH_BOOTSTRAP_SKIPPED",
        "Bootstrap already started, skipping duplicate call",
        {
          currentUrl: window.location.href,
          timestamp: new Date().toISOString(),
        }
      );
      return;
    }

    // Mark bootstrap as started
    sessionStorage.setItem(bootstrapKey, "true");

    const initializeAuth = async () => {
      const requestId = `bootstrap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const currentPath = location.pathname;
      const isPublicRoute = authUtils.isPublicRoute(currentPath);

      // Start in checking state while we verify with server
      setStoreAuthStatus("checking");
      setStoreAuthReady(false);

      try {
        // Skip API call for public routes - no need to verify session
        if (isPublicRoute) {

          // Set as unauthenticated for public routes
          setStoreUser(null);
          setIsAuthenticated(false);
          setStoreAuthStatus("unauthenticated");
          setStoreAuthReady(true);
          return;
        }

        // Import authApi dynamically to avoid circular dependencies
        const { authApi } = await import("../../../../../packages/config/api");

        // Verify session with server using HTTP-only cookies
        // This will gracefully handle unauthenticated users without throwing errors
        let sessionResult = await authApi.verifySession();

        // If session verification fails, attempt silent refresh
        if (!sessionResult.success) {
          secureLogger.info(
            "🔍 FRONTEND_AUTH_SESSION_INVALID",
            "Session invalid, attempting silent refresh",
            {
              requestId,
              currentPath,
            }
          );

          // Attempt to refresh token
          const refreshResult = await authApi.refreshToken();

          if (refreshResult.success) {
            // Retry session verification after successful refresh
            secureLogger.info(
              "🔍 FRONTEND_AUTH_REFRESH_SUCCESS",
              "Token refresh successful, retrying session verification",
              {
                requestId,
              }
            );
            sessionResult = await authApi.verifySession();
          } else {
            // Refresh failed - refresh token expired or invalid
            secureLogger.info(
              "🔍 FRONTEND_AUTH_REFRESH_FAILED",
              "Token refresh failed, user must log in",
              {
                requestId,
                error: refreshResult.error,
              }
            );
          }
        }

        if (sessionResult.success && sessionResult.user) {
          // User is authenticated, update store with user data
          // Check if we have a full UserProfile or just basic user info
          const user = sessionResult.user;
          if ("created_at" in user && "is_active" in user) {
            // Full UserProfile from session verification

            setStoreUser(user as UserProfile);
          } else {
            // Basic user info - this shouldn't happen with session verification
            // but we'll handle it gracefully
            secureLogger.warn(
              "🔍 FRONTEND_AUTH_BOOTSTRAP_PARTIAL_USER",
              "Received partial user data",
              {
                requestId,
                userKeys: Object.keys(user),
                hasCreatedAt: "created_at" in user,
                hasIsActive: "is_active" in user,
              }
            );
            setStoreUser(null);
          }
          setIsAuthenticated(true);
          setStoreAuthStatus("authenticated");
         
        } else {
          // No valid session found - this is normal for unauthenticated users
          setStoreUser(null);
          setIsAuthenticated(false);
          setStoreAuthStatus("unauthenticated");
          secureLogger.info(
            "🔍 FRONTEND_AUTH_BOOTSTRAP_NO_SESSION",
            "No valid session found - user is not authenticated",
            {
              requestId,
              sessionSuccess: sessionResult.success,
              hasUser: !!sessionResult.user,
            }
          );
        }
      } catch (error) {
        const err = error as Error;
        secureLogger.error(
          "🔍 FRONTEND_AUTH_BOOTSTRAP_ERROR",
          "Auth bootstrap failed with error",
          {
            requestId,
            error: err?.message || "Unknown error",
            errorType: err?.constructor?.name || "Unknown",
            stack: err?.stack?.substring(0, 200) || "No stack trace",
          }
        );
        // Session verification failed - treat as unauthenticated
        setStoreUser(null);
        setIsAuthenticated(false);
        setStoreAuthStatus("unauthenticated");
      } finally {
        setStoreAuthReady(true);
        // Clear bootstrap key to allow future bootstrap calls
        sessionStorage.removeItem(bootstrapKey);

      }
    };

    void initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - no need to re-run on navigation

  // Cross-tab logout sync via BroadcastChannel
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("auth");
      bc.onmessage = (e) => {
        if (e?.data?.type === "logout") {
          // Perform local logout cleanup without server call
          setStoreUser(null);
          setIsAuthenticated(false);
          setStoreAuthStatus("unauthenticated");
          setStoreAuthReady(false);
        }
      };
    } catch {
      // BroadcastChannel not supported; ignore
    }
    return () => {
      try {
        bc?.close();
      } catch {
        /* ignore */
      }
    };
  }, [setIsAuthenticated, setStoreAuthReady, setStoreAuthStatus, setStoreUser]);

  // Gate rendering on bootstrap completion
  // Only render children when auth is ready (not checking)
  if (!authReady || storeAuthStatus === "checking") {
    return null;
  }

  return <>{children}</>;
}

export default AuthProvider;
