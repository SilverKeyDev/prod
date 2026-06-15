import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AUTH_CONFIG } from "packages/config/auth/auth";
import { clearSessionStorageForLogout } from "packages/features/homeauth/hooks/data/utils/logoutCleanup";
import { log } from "packages/logger";
import { getDocument, getWindow } from "packages/utils/core/platform";

import { getErrorMessage } from "./errorMessageHelpers";

type SessionTimeoutConfig = {
  /** Aligned with server session cookie max-age (8h). */
  idleTimeoutMs?: number;
  maxSessionMs?: number;
  checkIntervalMs?: number;
  /** When provided (e.g. on React Native), called instead of window redirect on logout */
  onLogout?: () => void | Promise<void>;
};

type SessionTimeoutState = {
  isIdle: boolean;
  timeRemaining: number;
  sessionExpired: boolean;
};

const SESSION_MAX_MS = AUTH_CONFIG.SESSION.MAX_DURATION;

const DEFAULT_CONFIG: Required<Omit<SessionTimeoutConfig, "onLogout">> & {
  onLogout?: SessionTimeoutConfig["onLogout"];
} = {
  idleTimeoutMs: SESSION_MAX_MS,
  maxSessionMs: SESSION_MAX_MS,
  checkIntervalMs: 60 * 1000,
};

const ACTIVITY_EVENTS = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"];

/**
 * Hook for managing session timeouts and idle detection
 * Implements SOC 2 requirement for session management
 */
export function useSessionTimeout(config: SessionTimeoutConfig = {}): SessionTimeoutState & {
  logout: () => void;
} {
  const onLogoutRef = useRef(config.onLogout);
  onLogoutRef.current = config.onLogout;

  // Memoize on primitive values only — inline `onLogout` arrows change every render and must not
  // be in deps (see App.tsx session timeout; causes "Maximum update depth exceeded").
  const fullConfig = useMemo(
    () => ({
      idleTimeoutMs: config.idleTimeoutMs ?? DEFAULT_CONFIG.idleTimeoutMs,
      maxSessionMs: config.maxSessionMs ?? DEFAULT_CONFIG.maxSessionMs,
      checkIntervalMs: config.checkIntervalMs ?? DEFAULT_CONFIG.checkIntervalMs,
    }),
    [config.idleTimeoutMs, config.maxSessionMs, config.checkIntervalMs]
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
    log.warn("AUTH", "Session timeout - logging out user", {
      reason: "session_timeout",
      currentPath: getWindow()?.location.pathname ?? "",
      sessionDuration: Date.now() - sessionStartRef.current,
      idleDuration: Date.now() - lastActivityRef.current,
    });

    const runLogout = async () => {
      try {
        if (onLogoutRef.current) {
          await onLogoutRef.current();
        }
      } catch (error: unknown) {
        log.error("AUTH", "Session timeout onLogout failed", {
          errorMessage: getErrorMessage(error),
        });
      }
      try {
        clearSessionStorageForLogout();
      } catch (error: unknown) {
        log.error("AUTH", "Error clearing session data", {
          errorMessage: getErrorMessage(error),
        });
      }
      if (!onLogoutRef.current) {
        const win = getWindow();
        if (win) win.location.href = "/login";
      }
    };
    void runLogout();

    setState({
      isIdle: true,
      timeRemaining: 0,
      sessionExpired: true,
    });
  }, []);

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
        log.warn("AUTH", "Maximum session duration exceeded");
        logout();
        return;
      }

      // Check idle timeout
      if (timeSinceActivity >= fullConfig.idleTimeoutMs) {
        log.warn("AUTH", "Idle timeout exceeded - auto-logging out");
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
