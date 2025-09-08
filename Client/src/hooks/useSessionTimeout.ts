import { useState, useEffect, useCallback, useRef } from 'react';
import { clearAuthTokens } from '../lib/authUtils';

interface SessionTimeoutConfig {
  idleTimeoutMs?: number;        // Default: 30 minutes
  maxSessionMs?: number;         // Default: 8 hours
  warningTimeMs?: number;        // Default: 5 minutes before timeout
  checkIntervalMs?: number;      // Default: 1 minute
}

interface SessionTimeoutState {
  isIdle: boolean;
  timeRemaining: number;
  showWarning: boolean;
  sessionExpired: boolean;
}

const DEFAULT_CONFIG: Required<SessionTimeoutConfig> = {
  idleTimeoutMs: 30 * 60 * 1000,      // 30 minutes
  maxSessionMs: 8 * 60 * 60 * 1000,   // 8 hours
  warningTimeMs: 5 * 60 * 1000,       // 5 minutes
  checkIntervalMs: 60 * 1000,         // 1 minute
};

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click',
];

/**
 * Hook for managing session timeouts and idle detection
 * Implements SOC 2 requirement for session management
 */
export function useSessionTimeout(config: SessionTimeoutConfig = {}): SessionTimeoutState & {
  extendSession: () => void;
  logout: () => void;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<SessionTimeoutState>({
    isIdle: false,
    timeRemaining: fullConfig.idleTimeoutMs,
    showWarning: false,
    sessionExpired: false,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const sessionStartRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();
  const warningShownRef = useRef<boolean>(false);


  // Force logout and cleanup
  const logout = useCallback(() => {
    console.warn('[SESSION_TIMEOUT] 🔒 Session timeout - logging out user', {
      reason: 'session_timeout',
      currentPath: window.location.pathname,
      sessionDuration: Date.now() - sessionStartRef.current,
      idleDuration: Date.now() - lastActivityRef.current
    });
    
    // Clear tokens
    clearAuthTokens();
    
    // Clear session data
    try {
      localStorage.removeItem('negotiationStrategy');
      localStorage.removeItem('negotiationSelectedHome');
      sessionStorage.clear();
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
    
    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('sessionTimeout'));
    
    // Navigate to login - use window.location for compatibility
    window.location.href = '/login';
    
    setState({
      isIdle: true,
      timeRemaining: 0,
      showWarning: false,
      sessionExpired: true,
    });
  }, []);

  // Extend session (reset timers)
  const extendSession = useCallback(() => {
    console.log('🔄 Session extended by user action');
    sessionStartRef.current = Date.now();
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
    
    setState(prev => ({
      ...prev,
      isIdle: false,
      showWarning: false,
      timeRemaining: fullConfig.idleTimeoutMs,
    }));
  }, [fullConfig.idleTimeoutMs]);


  // Set up activity listeners and session checking
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      warningShownRef.current = false;
      
      setState(prev => ({
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
        console.warn('🕐 Maximum session duration exceeded');
        logout();
        return;
      }

      // Check idle timeout
      if (timeSinceActivity >= fullConfig.idleTimeoutMs) {
        console.warn('😴 Idle timeout exceeded');
        logout();
        return;
      }

      // Check if warning should be shown
      const timeUntilTimeout = fullConfig.idleTimeoutMs - timeSinceActivity;
      const shouldShowWarning = timeUntilTimeout <= fullConfig.warningTimeMs;

      if (shouldShowWarning && !warningShownRef.current) {
        console.warn('⚠️ Session timeout warning shown');
        warningShownRef.current = true;
      }

      setState(prev => ({
        ...prev,
        timeRemaining: Math.max(0, timeUntilTimeout),
        showWarning: shouldShowWarning,
        isIdle: timeSinceActivity > fullConfig.idleTimeoutMs / 2,
      }));
    };

    // Add activity event listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start checking session
    intervalRef.current = setInterval(handleSessionCheck, fullConfig.checkIntervalMs);

    // Initial check
    handleSessionCheck();

    return () => {
      // Cleanup listeners
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fullConfig.idleTimeoutMs, fullConfig.maxSessionMs, fullConfig.warningTimeMs, fullConfig.checkIntervalMs, logout]);

  // Listen for cross-tab logout events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Listen for multiple token types being removed (secure auth uses different patterns)
      if ((e.key === 'id_token' || e.key === 'access_token' || e.key === 'refresh_token') && !e.newValue) {
        // Token removed in another tab
        logout();
      }
    };

    const handleSessionTimeout = () => {
      logout();
    };

    const handleAuthChange = () => {
      // Use polling to wait for localStorage to be updated properly
      let attempts = 0;
      const maxAttempts = 10;
      const checkInterval = 50;
      
      const checkAuthState = () => {
        const hasUser = localStorage.getItem('user');
        const hasAccessToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
        
        attempts++;
        
        console.log('[SESSION_TIMEOUT] 🔄 Auth change detected (attempt ' + attempts + '):', {
          hasUser: !!hasUser,
          hasAccessToken: !!hasAccessToken,
          currentPath: window.location.pathname,
          sessionExpired: state.sessionExpired
        });
        
        // If we have tokens but no user data, and haven't reached max attempts, try again
        if (!hasUser && hasAccessToken && attempts < maxAttempts) {
          console.log('[SESSION_TIMEOUT] ⏳ Waiting for localStorage user data...');
          setTimeout(checkAuthState, checkInterval);
          return;
        }
        
        // Only logout if both user and tokens are missing (indicating intentional logout)
        if (!hasUser && !hasAccessToken) {
          console.log('[SESSION_TIMEOUT] ❌ No user or tokens found, triggering logout');
          logout();
        } else if (hasUser) {
          // User logged in - reset session timers
          console.log('[SESSION_TIMEOUT] ✅ User found, resetting session timers');
          sessionStartRef.current = Date.now();
          lastActivityRef.current = Date.now();
          warningShownRef.current = false;
          
          setState(prev => ({
            ...prev,
            isIdle: false,
            showWarning: false,
            timeRemaining: fullConfig.idleTimeoutMs,
            sessionExpired: false,
          }));
        } else if (hasAccessToken && !hasUser && attempts >= maxAttempts) {
          // We have tokens but no user data after max attempts - this is likely a login in progress
          console.log('[SESSION_TIMEOUT] ⚠️ Have tokens but no user data after max attempts - assuming login in progress');
          // Don't logout, just reset session timers
          sessionStartRef.current = Date.now();
          lastActivityRef.current = Date.now();
          warningShownRef.current = false;
          
          setState(prev => ({
            ...prev,
            isIdle: false,
            showWarning: false,
            timeRemaining: fullConfig.idleTimeoutMs,
            sessionExpired: false,
          }));
        }
      };
      
      checkAuthState();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionTimeout', handleSessionTimeout);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionTimeout', handleSessionTimeout);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [fullConfig.idleTimeoutMs, logout]); // Add dependencies for proper cleanup

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
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
