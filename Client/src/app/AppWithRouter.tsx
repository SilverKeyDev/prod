import { UserProfile } from "../context";
import { AppRoutes } from "./routes";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import { SessionTimeoutWarning } from "../components/security/SessionTimeoutWarning";
import { useAuth } from "./providers";
import { useEffect } from "react";

interface AppWithRouterProps {
  user: UserProfile | null;
  handleLogout: () => void;
  setLoading: (loading: boolean) => void;
}

export function AppWithRouter({
  user,
  handleLogout,
  setLoading,
}: AppWithRouterProps) {
  const { authReady } = useAuth();

  // Session timeout management for authenticated users - now inside Router context
  const sessionTimeout = useSessionTimeout({
    idleTimeoutMs: 30 * 60 * 1000, // 30 minutes idle
    maxSessionMs: 8 * 60 * 60 * 1000, // 8 hours max
    warningTimeMs: 5 * 60 * 1000, // 5 minute warning
  });

  // Wait for AuthProvider to be ready before showing routes
  useEffect(() => {
    if (authReady) {
      console.log("🔒 [APP] AuthProvider ready, stopping loading state");
      setLoading(false);
    }
  }, [authReady, setLoading]);

  // Show loading until AuthProvider is ready
  if (!authReady) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <div className="shimmer w-32 h-8 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white">
      <AppRoutes user={user} handleLogout={handleLogout} />

      {/* Session timeout warning for authenticated users */}
      {user && (
        <SessionTimeoutWarning
          timeRemaining={sessionTimeout.timeRemaining}
          onExtendSession={sessionTimeout.extendSession}
          onLogout={sessionTimeout.logout}
          isVisible={sessionTimeout.showWarning}
        />
      )}
    </div>
  );
}
