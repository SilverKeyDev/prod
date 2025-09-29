import { useEffect } from "react";
import {
  useAuthStore,
  type AuthState,
} from "../../../packages/store/auth.slice";

/**
 * AuthBootstrap component that initializes auth state before Router renders
 * This ensures auth status is determined synchronously before any route guards run
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setAuthReady = useAuthStore((s: AuthState) => s.setAuthReady);
  const setAuthStatus = useAuthStore((s: AuthState) => s.setAuthStatus);
  const setUser = useAuthStore((s: AuthState) => s.setUser);
  const setIsAuthenticated = useAuthStore(
    (s: AuthState) => s.setIsAuthenticated,
  );

  useEffect(() => {
    // Synchronously check for existing auth state
    const storedToken = sessionStorage.getItem("access_token");
    const storedUser = sessionStorage.getItem("user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
        setAuthStatus("authenticated");
      } catch {
        // Invalid stored data, clear it
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("user");
        setAuthStatus("unauthenticated");
      }
    } else {
      setAuthStatus("unauthenticated");
    }

    setAuthReady(true);
  }, [setAuthReady, setAuthStatus, setUser, setIsAuthenticated]);

  return <>{children}</>;
}
