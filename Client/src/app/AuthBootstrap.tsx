import { useEffect } from "react";
import { useAuthStore } from "../core/store/auth.slice";

/**
 * AuthBootstrap component that initializes auth state before Router renders
 * This ensures auth status is determined synchronously before any route guards run
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const setAuthStatus = useAuthStore((s) => s.setAuthStatus);
  const setUser = useAuthStore((s) => s.setUser);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);

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
