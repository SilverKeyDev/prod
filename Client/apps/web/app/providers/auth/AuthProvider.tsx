/**
 * Authentication Provider
 * Gates the app on deterministic bootstrap that completes before routes mount
 * Implements tri-state auth: 'booting' | 'authenticated' | 'unauthenticated'
 */

import { useEffect, type ReactNode } from "react";

import { useAuthStore } from "../../../../../packages/store/auth.slice";
import { useAuthStoreIntegration } from "../../../../../packages/hooks/store/useAuthStoreIntegration";
import { secureLogger } from "../../../../../packages/services/security/secureLogger";
import type { UserProfile } from "../../../../../packages/schemas/user";

import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export type AuthBootstrapStatus =
  | "booting"
  | "authenticated"
  | "unauthenticated";

export function AuthProvider({ children }: AuthProviderProps) {
  // Initialize auth system - this calls useSecureAuth() once for the entire app
  // Get logout from useAuthStoreIntegration which uses the correct useSecureAuth.logout
  const { logout: authLogout } = useAuthStoreIntegration();

  // Get auth state directly from store (not from useAuthState which checks localStorage)
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const storeAuthStatus = useAuthStore((s) => s.authStatus);
  const setStoreAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s) => s.setAuthReady);
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);

  // Map store authStatus to bootstrap status
  const status: AuthBootstrapStatus =
    storeAuthStatus === "checking"
      ? "booting"
      : storeAuthStatus === "authenticated"
        ? "authenticated"
        : "unauthenticated";

  // Debug logging for status changes
  useEffect(() => {
    console.log("🔐 [AUTH_PROVIDER] Status updated:", {
      storeAuthStatus,
      derivedStatus: status,
      timestamp: new Date().toISOString(),
    });
  }, [storeAuthStatus, status]);

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

      secureLogger.info(
        "🔍 FRONTEND_AUTH_BOOTSTRAP_START",
        "Initializing auth state",
        {
          requestId,
          currentUrl: window.location.href,
          currentPath: window.location.pathname,
          searchParams: window.location.search,
          timestamp: new Date().toISOString(),
        }
      );

      // Start in checking state while we verify with server
      setStoreAuthStatus("checking");
      setStoreAuthReady(false);

      try {
        // Import authApi dynamically to avoid circular dependencies
        const { authApi } = await import(
          "../../../../../packages/config/api/auth"
        );

        secureLogger.info(
          "🔍 FRONTEND_AUTH_BOOTSTRAP_CALLING_VERIFY",
          "Calling verifySession",
          {
            requestId,
            authApiAvailable: !!authApi,
            verifySessionAvailable: !!authApi?.verifySession,
          }
        );

        // Verify session with server using HTTP-only cookies
        // This will gracefully handle unauthenticated users without throwing errors
        const sessionResult = await authApi.verifySession();

        secureLogger.info(
          "🔍 FRONTEND_AUTH_BOOTSTRAP_VERIFY_RESULT",
          "Received verifySession result",
          {
            requestId,
            success: sessionResult.success,
            hasUser: !!sessionResult.user,
            userEmail: sessionResult.user?.email
              ? `${sessionResult.user.email.substring(0, 3)}***${sessionResult.user.email.substring(sessionResult.user.email.length - 3)}`
              : "missing",
            userId: sessionResult.user?.id || "missing",
          }
        );

        if (sessionResult.success && sessionResult.user) {
          // User is authenticated, update store with user data
          // Check if we have a full UserProfile or just basic user info
          const user = sessionResult.user;
          if ("created_at" in user && "is_active" in user) {
            // Full UserProfile from session verification
            setStoreUser(user as UserProfile);
            secureLogger.info(
              "🔍 FRONTEND_AUTH_BOOTSTRAP_FULL_USER",
              "Setting full user profile",
              {
                requestId,
                userId: user.id,
                userEmail: user.email
                  ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 3)}`
                  : "missing",
                userName: user.name || "missing",
              }
            );
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
          secureLogger.info(
            "🔍 FRONTEND_AUTH_BOOTSTRAP_SUCCESS",
            "User authenticated via session cookies",
            {
              requestId,
              userId: user.id,
              userEmail: user.email
                ? `${user.email.substring(0, 3)}***${user.email.substring(user.email.length - 3)}`
                : "missing",
            }
          );
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
        secureLogger.info(
          "🔍 FRONTEND_AUTH_BOOTSTRAP_COMPLETE",
          "Auth bootstrap completed",
          {
            requestId,
            finalStatus: storeAuthStatus,
            finalAuthenticated: isAuthenticated,
            authReady: true,
          }
        );
      }
    };

    void initializeAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount - Zustand setters are stable

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

  // Wrap logout to ensure it returns Promise<void> for context type compatibility
  const logout = async (): Promise<void> => {
    await authLogout();
  };

  const contextValue = {
    user,
    isAuthenticated,
    authReady,
    status, // Expose bootstrap status (derived from store)
    logout,
  };

  // Gate rendering on bootstrap completion
  return (
    <AuthContext.Provider value={contextValue}>
      {status === "booting" ? null : children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
