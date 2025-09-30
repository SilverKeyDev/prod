/**
 * Authentication Provider
 * Gates the app on deterministic bootstrap that completes before routes mount
 * Implements tri-state auth: 'booting' | 'authenticated' | 'unauthenticated'
 */

import { useEffect, type ReactNode } from "react";

import { useLogout } from "../../../../../packages/hooks/ui/useLogout";
import { useAuthStore } from "../../../../../packages/store/auth.slice";
import { secureLogger } from "../../../../../packages/services/security/secureLogger";

import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export type AuthBootstrapStatus =
  | "booting"
  | "authenticated"
  | "unauthenticated";

export function AuthProvider({ children }: AuthProviderProps) {
  const { logout } = useLogout();

  // Get auth state directly from store (not from useAuthState which checks localStorage)
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const storeAuthStatus = useAuthStore((s) => s.authStatus);
  const setStoreAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s) => s.setAuthReady);

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

  // Initialize auth state without server verification
  useEffect(() => {
    secureLogger.info("AUTH_BOOTSTRAP", "Initializing auth state");

    // Set initial unauthenticated state
    setStoreAuthStatus("unauthenticated");
    setStoreAuthReady(true);

    secureLogger.info("AUTH_BOOTSTRAP_COMPLETE", "Auth state initialized");
  }, [setStoreAuthStatus, setStoreAuthReady]);

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
