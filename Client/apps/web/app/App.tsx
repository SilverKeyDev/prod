import { useState, useEffect, useMemo } from "react";

// Note: StrictMode is disabled for cleaner development logs
// Re-enable by wrapping App with <StrictMode> in main.tsx when debugging React issues

import ToastsPortal from "../components/feedback/ToastsPortal";
import { SessionTimeoutWarning } from "../components/security/SessionTimeoutWarning";
import { useSavedHomesStoreIntegration } from "../../../packages/hooks/store/useSavedHomesStoreIntegration";
import { useDocumentsStoreIntegration } from "../../../packages/hooks/store/useDocumentsStoreIntegration";
import { useGoogleMapsStoreIntegration } from "../../../packages/hooks/store/useGoogleMapsStoreIntegration";
import { useSessionTimeout } from "../../../packages/hooks/ui/useSessionTimeout";
import type { UserProfile } from "../../../packages/schemas/user";
import MaintenanceScreen from "../pages/HomeAuth/MaintenanceScreen";

import { useAuthStore } from "../../../packages/store/auth.slice";
import { useAuthStoreIntegration } from "../../../packages/hooks/store/useAuthStoreIntegration";
import { AppRoutes } from "./routes";

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [maintenance, setMaintenance] = useState(false); // Only show maintenance if health check fails
  const [healthCheckComplete, setHealthCheckComplete] = useState(false);

  // Read from auth store directly to avoid multiple instances of useSecureAuth
  const authReady = useAuthStore((s) => s.authReady);
  const authUser = useAuthStore((s) => s.user);

  // Get logout function from useAuthStoreIntegration (uses correct useSecureAuth.logout)
  const { logout: authLogout } = useAuthStoreIntegration();

  useSavedHomesStoreIntegration();
  useDocumentsStoreIntegration();
  useGoogleMapsStoreIntegration();

  // Memoize session timeout config to prevent recreating on every render
  const sessionTimeoutConfig = useMemo(
    () => ({
      idleTimeoutMs: 30 * 60 * 1000, // 30 minutes idle
      maxSessionMs: 8 * 60 * 60 * 1000, // 8 hours max
      warningTimeMs: 5 * 60 * 1000, // 5 minute warning
    }),
    [],
  );

  const sessionTimeout = useSessionTimeout(sessionTimeoutConfig) as {
    timeRemaining: number;
    extendSession: () => void;
    showWarning: boolean;
  };

  // Health check
  useEffect(() => {
    let isMounted = true;
    fetch("/healthz", { method: "GET" })
      .then((res) => {
        if (!res.ok) {
          console.error("/healthz responded with status:", res.status);
          throw new Error(`Healthz failed with status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: unknown) => {
        if (isMounted) {
          if (
            data &&
            typeof data === "object" &&
            data !== null &&
            "status" in data &&
            (data as { status: string }).status === "ok"
          ) {
            setMaintenance(false);
          } else {
            setMaintenance(true);
            console.warn("/healthz returned unexpected data:");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setMaintenance(true);
          console.error("Error fetching /healthz:", err);
        }
      })
      .finally(() => {
        if (isMounted) setHealthCheckComplete(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize error reporting on app start
  useEffect(() => {
    // TODO: Add Sentry DSN to environment configuration when needed
    // For now, error reporting is handled by ErrorBoundary components
    console.log("Error reporting initialized via ErrorBoundary");
  }, []);

  // Wait for both health check and auth store to be ready before showing routes
  useEffect(() => {
    // Only set loading to false when both health check is done AND auth is ready
    if (healthCheckComplete && authReady) {
      // Add a small delay to prevent rapid state transitions that cause flashing
      const timer = setTimeout(() => {
        setLoading(false);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [healthCheckComplete, authReady]);

  // Sync auth user with local state
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    } else {
      setUser(null);
    }
  }, [authUser]);

  // Get logout function from Zustand auth store
  const logout = authLogout;

  // Show loading state if any of these conditions are true
  const isLoading = loading || !authReady;

  return (
    <>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-off-white">
          <div className="shimmer h-8 w-32 rounded-lg"></div>
        </div>
      ) : maintenance ? (
        <MaintenanceScreen />
      ) : (
        <div className="min-h-screen bg-off-white">
          <AppRoutes user={user} handleLogout={logout} />

          {/* Session timeout warning for authenticated users */}
          {user && (
            <SessionTimeoutWarning
              timeRemaining={sessionTimeout.timeRemaining}
              onExtendSession={sessionTimeout.extendSession}
              onLogout={logout}
              isVisible={sessionTimeout.showWarning}
            />
          )}

          {/* Global toasts */}
          <ToastsPortal />
        </div>
      )}
    </>
  );
}

export default App;
