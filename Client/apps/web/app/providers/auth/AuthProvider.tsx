/**
 * Authentication Provider
 * Gates the app on deterministic bootstrap that completes before routes mount
 * Handles initial auth verification with server
 */

import { type ReactNode, useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import { secureLogger } from "packages/services/security/secureLogger";
import { useAuthStore } from "packages/store";
import { dateNow } from "packages/utils/date";

import { runAuthBootstrap } from "./authBootstrap";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const location = useLocation();

  const authReady = useAuthStore((s) => s.authReady);
  const storeAuthStatus = useAuthStore((s) => s.authStatus);
  const setStoreAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setStoreAuthReady = useAuthStore((s) => s.setAuthReady);
  const setStoreUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);

  const authStatusRef = useRef(storeAuthStatus);
  authStatusRef.current = storeAuthStatus;

  useEffect(() => {
    const bootstrapKey = "auth_bootstrap_started";
    if (sessionStorage.getItem(bootstrapKey)) {
      secureLogger.info(
        "🔍 FRONTEND_AUTH_BOOTSTRAP_SKIPPED",
        "Bootstrap already started, skipping duplicate call",
        {
          currentUrl: window.location.href,
          timestamp: dateNow().toISOString(),
        }
      );
      return;
    }
    sessionStorage.setItem(bootstrapKey, "true");
    void runAuthBootstrap(location.pathname, {
      setStoreAuthStatus,
      setStoreAuthReady,
      setStoreUser,
      setIsAuthenticated,
      getAuthStatusRef: () => authStatusRef.current,
    });
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
