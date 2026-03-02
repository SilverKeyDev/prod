import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { clearAuthTokens } from "packages/utils";
import { getDocument, getWindow } from "packages/utils/platform";
import { getSessionStorage } from "packages/utils/storage/platformStorage";

import { getErrorMessage } from "./errorMessageHelpers";

type SessionTimeoutConfig = {
  idleTimeoutMs?: number; // Default: 30 minutes
  maxSessionMs?: number; // Default: 8 hours
  checkIntervalMs?: number; // Default: 1 minute
  /** When provided (e.g. on React Native), called instead of window redirect on logout */
  onLogout?: () => void;
};

type SessionTimeoutState = {
  isIdle: boolean;
  timeRemaining: number;
  sessionExpired: boolean;
};

const DEFAULT_CONFIG: Required<SessionTimeoutConfig> = {
  idleTimeoutMs: 30 * 60 * 1000, // 30 minutes
  maxSessionMs: 8 * 60 * 60 * 1000, // 8 hours
  checkIntervalMs: 60 * 1000, // 1 minute
};

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

/**
 * Hook for managing session timeouts and idle detection
 * Implements SOC 2 requirement for session management
 */
export function useSessionTimeout(config: SessionTimeoutConfig = {}): SessionTimeoutState & {
  logout: () => void;
} {
  // Memoize on primitive values so default {} does not change every render (avoids effect loop).
  // Intentionally omit `config` from deps; primitive values are the stable dependency source.
  const fullConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config object reference is unstable when omitted; primitives are stable
    [config?.idleTimeoutMs, config?.maxSessionMs, config?.checkIntervalMs, config?.onLogout]
  );

  const [state, setState] = useState<SessionTimeoutState>({
    isIdle: false,
    timeRemaining: fullConfig.idleTimeoutMs,
    sessionExpired: false,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const lastSetStateRef = useRef<number>(0);
  const ACTIVITY_THROTTLE_MS = 500;

  // Force logout and cleanup
  const logout = useCallback(() => {
    log.warn(LOG_CATEGORIES.AUTH, "Session timeout - logging out user", {
      reason: "session_timeout",
      currentPath: getWindow()?.location.pathname ?? "",
      sessionDuration: Date.now() - sessionStartRef.current,
      idleDuration: Date.now() - lastActivityRef.current,
    });

    // Clear tokens
    clearAuthTokens();

    // Clear session data
    try {
      const session = getSessionStorage();
      session.removeItem("negotiationStrategy");
      session.removeItem("negotiationSelectedHome");
      session.clear();
    } catch (error: unknown) {
      log.error(LOG_CATEGORIES.AUTH, "Error clearing session data", {
        errorMessage: getErrorMessage(error),
      });
    }

    // Navigate to login - use onLogout callback on RN, else window.location
    if (fullConfig.onLogout) {
      fullConfig.onLogout();
    } else {
      const win = getWindow();
      if (win) win.location.href = "/login";
    }

    setState({
      isIdle: true,
      timeRemaining: 0,
      sessionExpired: true,
    });
  }, [fullConfig]);

  // Set up activity listeners and session checking
  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastSetStateRef.current < ACTIVITY_THROTTLE_MS) return;
      lastSetStateRef.current = now;
      setState((prev) => ({
        ...prev,
        isIdle: false,
        timeRemaining: fullConfig.idleTimeoutMs,
      }));
    };

    const handleSessionCheck = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeSinceStart = now - sessionStartRef.current;

      // Check absolute session limit
      if (timeSinceStart >= fullConfig.maxSessionMs) {
        log.warn(LOG_CATEGORIES.AUTH, "Maximum session duration exceeded");
        logout();
        return;
      }

      // Check idle timeout
      if (timeSinceActivity >= fullConfig.idleTimeoutMs) {
        log.warn(LOG_CATEGORIES.AUTH, "Idle timeout exceeded - auto-logging out");
        logout();
        return;
      }

      const timeUntilTimeout = fullConfig.idleTimeoutMs - timeSinceActivity;

      setState((prev) => ({
        ...prev,
        timeRemaining: Math.max(0, timeUntilTimeout),
        isIdle: timeSinceActivity > fullConfig.idleTimeoutMs / 2,
      }));
    };

    // Add activity event listeners
    const doc = getDocument();
    if (doc) {
      ACTIVITY_EVENTS.forEach((event) => {
        doc.addEventListener(event, handleActivity, { passive: true });
      });
    }

    // Start checking session
    intervalRef.current = setInterval(handleSessionCheck, fullConfig.checkIntervalMs);

    // Initial check
    handleSessionCheck();

    return () => {
      // Cleanup listeners
      const doc = getDocument();
      if (doc) {
        ACTIVITY_EVENTS.forEach((event) => {
          doc.removeEventListener(event, handleActivity);
        });
      }

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
