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
    const initializeAuth = async () => {
      secureLogger.info("AUTH_BOOTSTRAP", "Initializing auth state");

      // Start in checking state while we verify with server
      setStoreAuthStatus("checking");
      setStoreAuthReady(false);

      try {
        // Import authApi dynamically to avoid circular dependencies
        const { authApi } = await import(
          "../../../../../packages/config/api/auth"
        );

        // Verify session with server using HTTP-only cookies
        // This will gracefully handle unauthenticated users without throwing errors
        const sessionResult = await authApi.verifySession();

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
              "AUTH_BOOTSTRAP_PARTIAL_USER",
              "Received partial user data"
            );
            setStoreUser(null);
          }
          setIsAuthenticated(true);
          setStoreAuthStatus("authenticated");
          secureLogger.info(
            "AUTH_BOOTSTRAP_SUCCESS",
            "User authenticated via session cookies"
          );
        } else {
          // No valid session found - this is normal for unauthenticated users
          setStoreUser(null);
          setIsAuthenticated(false);
          setStoreAuthStatus("unauthenticated");
          secureLogger.info(
            "AUTH_BOOTSTRAP_NO_SESSION",
            "No valid session found - user is not authenticated"
          );
        }
      } catch (error) {
        // Session verification failed - treat as unauthenticated
        setStoreUser(null);
        setIsAuthenticated(false);
        setStoreAuthStatus("unauthenticated");
        secureLogger.info(
          "AUTH_BOOTSTRAP_ERROR",
          "Session verification failed - treating as unauthenticated",
          { error: error instanceof Error ? error.message : "Unknown error" }
        );
      } finally {
        setStoreAuthReady(true);
        secureLogger.info("AUTH_BOOTSTRAP_COMPLETE", "Auth state initialized");
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
