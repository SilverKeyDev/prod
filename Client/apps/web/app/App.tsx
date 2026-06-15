import { useCallback, useEffect, useState } from "react";

import { useHealthCheck, useSessionTimeout } from "packages/hooks/ui";
import { useAuthStore } from "packages/store";
import { Box } from "packages/ui/components/structure/primitives";

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

  const handleSessionTimeoutLogout = useCallback(() => {
    void authLogout();
  }, [authLogout]);

  // Health check
  const { maintenance, healthCheckComplete } = useHealthCheck();

  // Session timeout: 8h idle/max (aligned with server session cookie); server logout on expiry
  useSessionTimeout({ onLogout: handleSessionTimeoutLogout });

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
        <Box className="flex min-h-screen items-center justify-center bg-background-base">
          <Box className="shimmer h-8 w-32 rounded-lg"></Box>
        </Box>
      ) : maintenance ? (
        <MaintenanceScreen />
      ) : (
        <Box className="min-h-screen bg-background-base">
          <AppRoutes user={authUser} handleLogout={authLogout} />

          {/* Global toasts */}
          <ToastsPortal />
        </Box>
      )}
    </>
  );
}

export default App;
