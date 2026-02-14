import { useState, useEffect, useMemo } from "react";

// Note: StrictMode is disabled for cleaner development logs
// Re-enable by wrapping App with <StrictMode> in main.tsx when debugging React issues

import ToastsPortal from "../components/feedback/ToastsPortal";
import { useSessionTimeout } from "../../../packages/hooks/ui/useSessionTimeout";
import { useHealthCheck } from "../../../packages/hooks/ui/useHealthCheck";
import MaintenanceScreen from "../pages/HomeAuth/MaintenanceScreenPage";

import { useAuthStore } from "../../../packages/store/auth.slice";
import { useAuthStoreIntegration } from "../../../packages/hooks/store/auth/useAuthStoreIntegration";
import { AppRoutes } from "./routes";

function App() {
  const [loading, setLoading] = useState(true);

  // Read from auth store directly to avoid multiple instances of useSecureAuth
  const authReady = useAuthStore((s) => s.authReady);
  const authUser = useAuthStore((s) => s.user);

  // Get logout function from useAuthStoreIntegration (uses correct useSecureAuth.logout)
  const { logout: authLogout } = useAuthStoreIntegration();

  // Health check
  const { maintenance, healthCheckComplete } = useHealthCheck();

  // Memoize session timeout config to prevent recreating on every render
  const sessionTimeoutConfig = useMemo(
    () => ({
      idleTimeoutMs: 30 * 60 * 1000, // 30 minutes idle
      maxSessionMs: 8 * 60 * 60 * 1000, // 8 hours max
    }),
    [],
  );

  // Initialize session timeout (auto-logout when timeout is reached)
  useSessionTimeout(sessionTimeoutConfig);

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
          <AppRoutes user={authUser} handleLogout={authLogout} />

          {/* Global toasts */}
          <ToastsPortal />
        </div>
      )}
    </>
  );
}

export default App;
