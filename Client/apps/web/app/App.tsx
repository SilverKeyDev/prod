import { useEffect, useState } from "react";

import { useHealthCheck, useSessionTimeout } from "packages/hooks/ui";
import { useAuthStore } from "packages/store";

// Note: StrictMode is disabled for cleaner development logs
// Re-enable by wrapping App with <StrictMode> in main.tsx when debugging React issues
// Navigation: Do not wrap App (or the component that renders AppRoutes) in React.memo
// without including router state (e.g. location) in the comparison, or nav-driven rerenders may not run.
import ToastsPortal from "@/components/feedback/ToastsPortal";
import { useAuthStoreIntegration } from "@/features/homeauth/hooks/store/useAuthStoreIntegration";
import MaintenanceScreen from "@/pages/HomeAuth/homepage/MaintenanceScreenPage";

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

  // Initialize session timeout (auto-logout when timeout is reached)
  // Uses default config from hook: 30 min idle, 8 hours max
  useSessionTimeout();

  // Wait for both health check and auth store to be ready before showing routes
  useEffect(() => {
    if (!healthCheckComplete || !authReady) return;
    // Only transition to non-loading when currently loading to avoid redundant updates
    const timer = setTimeout(() => {
      setLoading((prev) => (prev ? false : prev));
    }, 100);
    return () => clearTimeout(timer);
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
