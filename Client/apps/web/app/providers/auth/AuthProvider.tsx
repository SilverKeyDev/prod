/**
 * Authentication Provider
 * Gates the app on deterministic bootstrap that completes before routes mount
 * Handles initial auth verification with server
 */

import { type ReactNode, useEffect, useRef } from "react";

import { useLocation } from "react-router-dom";

import { ClientSettingsBootstrap } from "packages/features/homeauth/components/ClientSettingsBootstrap";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/primitives";

import { runAuthBootstrap } from "./authBootstrap";

/**
 * One bootstrap promise per full page load (survives React StrictMode remounts).
 * Kept after settle so a second dev StrictMode effect does not start another verifySession.
 */
let authBootstrapOnce: Promise<void> | null = null;

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const authStatusRef = useRef(storeAuthStatus);
  authStatusRef.current = storeAuthStatus;

  useEffect(() => {
    if (!authBootstrapOnce) {
      authBootstrapOnce = runAuthBootstrap(location.pathname, {
        setStoreAuthStatus,
        setStoreAuthReady,
        setStoreUser,
        setIsAuthenticated,
        getAuthStatusRef: () => authStatusRef.current,
      });
    }
    void authBootstrapOnce;
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
    return (
      <Box className="flex min-h-screen items-center justify-center bg-background-base">
        <Box className="shimmer h-8 w-32 rounded-lg" />
      </Box>
    );
  }

  return (
    <>
      {isAuthenticated ? <ClientSettingsBootstrap /> : null}
      {children}
    </>
  );
}

export default AuthProvider;
