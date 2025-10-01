import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { clearAuthTokens } from "../../utils/auth";

type SessionTimeoutConfig = {
  idleTimeoutMs?: number; // Default: 30 minutes
  maxSessionMs?: number; // Default: 8 hours
  warningTimeMs?: number; // Default: 5 minutes before timeout
  checkIntervalMs?: number; // Default: 1 minute
};

type SessionTimeoutState = {
  isIdle: boolean;
  timeRemaining: number;
  showWarning: boolean;
  sessionExpired: boolean;
};

const DEFAULT_CONFIG: Required<SessionTimeoutConfig> = {
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  maxSessionMs: 8 * 60 * 60 * 1000, // 8 hours
  warningTimeMs: 5 * 60 * 1000, // 5 minutes
  checkIntervalMs: 60 * 1000, // 1 minute
};

const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keypress",
  "scroll",
  "touchstart",
  "click",
];

/**
 * Hook for managing session timeouts and idle detection
 * Implements SOC 2 requirement for session management
 */
export function useSessionTimeout(
  config: SessionTimeoutConfig = {},
): SessionTimeoutState & {
  extendSession: () => void;
  logout: () => void;
} {
  const fullConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );

  const [state, setState] = useState<SessionTimeoutState>({
    isIdle: false,
    timeRemaining: fullConfig.idleTimeoutMs,
    showWarning: false,
    sessionExpired: false,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const warningShownRef = useRef<boolean>(false);

  // Force logout and cleanup
  const logout = useCallback(() => {
    console.warn("[SESSION_TIMEOUT] 🔒 Session timeout - logging out user", {
      reason: "session_timeout",
      currentPath: window.location.pathname,
      sessionDuration: Date.now() - sessionStartRef.current,
      idleDuration: Date.now() - lastActivityRef.current,
    });

    // Clear tokens
    clearAuthTokens();

    // Clear session data
    try {
      sessionStorage.removeItem("negotiationStrategy");
      sessionStorage.removeItem("negotiationSelectedHome");
      sessionStorage.clear();
    } catch (error: unknown) {
      // Type-safe error handling with proper type guards
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null
            ? (() => {
                try {
                  return JSON.stringify(error);
                } catch {
                  return "[Object]";
                }
              })()
            : (() => {
                try {
                  if (typeof error === "string") return error;
                  if (typeof error === "number") return String(error);
                  if (typeof error === "boolean") return String(error);
                  if (error === null || error === undefined)
                    return "Unknown error";
                  return "[Unknown]";
                } catch {
                  return "[Unknown]";
                }
              })();
      console.error("Error clearing session data:", errorMessage);
    }

    // Navigate to login - use window.location for compatibility
    window.location.href = "/login";

    setState({
      isIdle: true,
      timeRemaining: 0,
      showWarning: false,
      sessionExpired: true,
    });
  }, []); // Refs are stable and don't need to be dependencies

  // Extend session (reset timers)
  const extendSession = useCallback(() => {
    console.log("🔄 Session extended by user action");
    sessionStartRef.current = Date.now();
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;

    setState((prev) => ({
      ...prev,
      isIdle: false,
      showWarning: false,
      timeRemaining: fullConfig.idleTimeoutMs,
    }));
  }, [fullConfig.idleTimeoutMs]); // Refs are stable and don't need to be dependencies

  // Set up activity listeners and session checking
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;

      setState((prev) => ({
        ...prev,
        isIdle: false,
        showWarning: false,
        timeRemaining: fullConfig.idleTimeoutMs,
      }));
    };

    const handleSessionCheck = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeSinceStart = now - sessionStartRef.current;

      // Check absolute session limit
      if (timeSinceStart >= fullConfig.maxSessionMs) {
        console.warn("🕐 Maximum session duration exceeded");
        logout();
        return;
      }

      // Check idle timeout
      if (timeSinceActivity >= fullConfig.idleTimeoutMs) {
        console.warn("😴 Idle timeout exceeded");
        logout();
        return;
      }

      // Check if warning should be shown
      const timeUntilTimeout = fullConfig.idleTimeoutMs - timeSinceActivity;
      const shouldShowWarning = timeUntilTimeout <= fullConfig.warningTimeMs;

      if (shouldShowWarning && !warningShownRef.current) {
        console.warn("⚠️ Session timeout warning shown");
        warningShownRef.current = true;
      }

      setState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, timeUntilTimeout),
        showWarning: shouldShowWarning,
        isIdle: timeSinceActivity > fullConfig.idleTimeoutMs / 2,
      }));
    };

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start checking session
    intervalRef.current = setInterval(
      handleSessionCheck,
      fullConfig.checkIntervalMs,
    );

    // Initial check
    handleSessionCheck();

    return () => {
      // Cleanup listeners
      ACTIVITY_EVENTS.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fullConfig, logout]);

  // Note: Cross-tab logout events are no longer tracked via sessionStorage tokens
  // Authentication state is managed via HTTP-only cookies
  // The AuthContext handles cross-tab auth changes via custom events if needed
  // Session timeout only handles actual timeout events based on user activity

  return {
    ...state,
    extendSession,
    logout,
  };
}

/**
 * Format time remaining for display
 */
export function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
