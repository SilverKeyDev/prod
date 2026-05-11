/**
 * Hook for Step-up Authentication
 * Provides easy integration for components requiring enhanced security
 */

import { useCallback, useRef, useState } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { secureLogger } from "packages/services/security/secureLogger";
import { getLocalStorage } from "packages/utils/storage/platformStorage";
import { hasProperty, isObject } from "packages/utils/typeGuards";

import { useLocalStorage } from "./useLocalStorage";

type StepUpAuthConfig = {
  requirePassword?: boolean;
  requireMFA?: boolean;
  maxAttempts?: number;
  cacheTimeMs?: number; // How long to cache successful authentication
};

type UseStepUpAuthReturn = {
  isStepUpRequired: (action: string) => boolean;
  requestStepUpAuth: (
    action: string,
    description?: string,
    config?: StepUpAuthConfig
  ) => Promise<boolean>;
  isStepUpModalOpen: boolean;
  stepUpModalProps: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    action: string;
    description?: string;
    requirePassword?: boolean;
    requireMFA?: boolean;
    maxAttempts?: number;
  };
};

// Actions that require step-up authentication
const SENSITIVE_ACTIONS = [
  "change_password",
  "update_payment_method",
  "delete_account",
  "export_data",
  "change_email",
  "disable_mfa",
  "view_financial_data",
  "update_security_settings",
  "access_admin_panel",
] as const;

type SensitiveAction = (typeof SENSITIVE_ACTIONS)[number];

const EMPTY_STEP_UP_CACHE: Record<string, number> = {};

/** Default step-up cache window; must match `checkStepUpRequired` (do not tie reads to in-flight modal `config`). */
const DEFAULT_STEP_UP_CACHE_MS = 15 * 60 * 1000;

export const useStepUpAuth = (): UseStepUpAuthReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  const [currentDescription, setCurrentDescription] = useState<string | undefined>();
  const [currentConfig, setCurrentConfig] = useState<StepUpAuthConfig>({});
  /** Must be a ref so concurrent/overlapping requests never drop a resolver (state would orphan earlier Promises). */
  const pendingResolveRef = useRef<((success: boolean) => void) | null>(null);
  /** Re-entrancy: same action must share one Promise or effects/guards will cancel each other and spam logs. */
  const pendingPromiseByActionRef = useRef<Partial<Record<string, Promise<boolean>>>>({});

  // Use centralized localStorage hook for step-up auth cache
  const { value: stepUpCache, setValue: setStepUpCache } = useLocalStorage<Record<string, number>>(
    "stepUpAuthCache",
    EMPTY_STEP_UP_CACHE
  );

  /**
   * Check if user has recently authenticated for this action
   */
  const isRecentlyAuthenticated = useCallback(
    (action: string): boolean => {
      const authTime = stepUpCache[action];
      if (!authTime) return false;
      return Date.now() - authTime < DEFAULT_STEP_UP_CACHE_MS;
    },
    [stepUpCache]
  );

  /**
   * Check if step-up authentication is required for an action
   */
  const isStepUpRequired = useCallback(
    (action: string): boolean => {
      // Check if action is in sensitive actions list
      if (SENSITIVE_ACTIONS.includes(action as SensitiveAction)) {
        return !isRecentlyAuthenticated(action);
      }

      // Custom logic for other actions
      if (action.includes("admin") || action.includes("delete") || action.includes("financial")) {
        return !isRecentlyAuthenticated(action);
      }

      return false;
    },
    [isRecentlyAuthenticated]
  );

  /**
   * Request step-up authentication for an action
   */
  const requestStepUpAuth = useCallback(
    (action: string, description?: string, config: StepUpAuthConfig = {}): Promise<boolean> => {
      if (!isStepUpRequired(action)) {
        return Promise.resolve(true);
      }
      const existing = pendingPromiseByActionRef.current[action];
      if (existing) {
        log.info(LOG_CATEGORIES.ROUTING, "[STEP_UP_AUTH] returning existing in-flight promise", {
          action,
        });
        return existing;
      }
      const promise = new Promise<boolean>((resolve) => {
        secureLogger.security("STEP_UP_AUTH", "Step-up authentication requested", { action });
        log.info(
          LOG_CATEGORIES.ROUTING,
          "[STEP_UP_AUTH] new step-up promise created (modal opening)",
          {
            action,
          }
        );

        if (pendingResolveRef.current) {
          log.info(LOG_CATEGORIES.ROUTING, "[STEP_UP_AUTH] superseding prior pending step-up", {
            action,
          });
          pendingResolveRef.current(false);
        }
        pendingResolveRef.current = resolve;

        setCurrentAction(action);
        setCurrentDescription(description);
        setCurrentConfig(config);
        setIsModalOpen(true);
        log.info(LOG_CATEGORIES.ROUTING, "[STEP_UP_AUTH] modal state set to open", { action });
      });
      pendingPromiseByActionRef.current[action] = promise;
      void promise.finally(() => {
        delete pendingPromiseByActionRef.current[action];
      });
      return promise;
    },
    [isStepUpRequired]
  );

  /**
   * Handle successful authentication
   */
  const handleSuccess = useCallback(() => {
    log.info(
      LOG_CATEGORIES.ROUTING,
      "[STEP_UP_AUTH] user confirmed step-up (before cache + resolve)",
      {
        action: currentAction,
      }
    );
    secureLogger.security("STEP_UP_AUTH", "Step-up authentication completed successfully", {
      action: currentAction,
    });

    // Cache successful authentication timestamp using centralized localStorage
    setStepUpCache((prev) => ({
      ...prev,
      [currentAction]: Date.now(),
    }));

    pendingResolveRef.current?.(true);
    pendingResolveRef.current = null;

    setIsModalOpen(false);
  }, [currentAction, setStepUpCache]);

  /**
   * Handle authentication cancellation
   */
  const handleClose = useCallback(() => {
    log.info(LOG_CATEGORIES.ROUTING, "[STEP_UP_AUTH] user cancelled step-up (resolving false)", {
      action: currentAction,
    });
    secureLogger.info("STEP_UP_AUTH", "Step-up authentication cancelled", {
      action: currentAction,
    });

    pendingResolveRef.current?.(false);
    pendingResolveRef.current = null;

    setIsModalOpen(false);
  }, [currentAction]);

  return {
    isStepUpRequired,
    requestStepUpAuth,
    isStepUpModalOpen: isModalOpen,
    stepUpModalProps: {
      isOpen: isModalOpen,
      onClose: handleClose,
      onSuccess: handleSuccess,
      action: currentAction,
      description: currentDescription,
      requirePassword: currentConfig.requirePassword ?? true,
      requireMFA: currentConfig.requireMFA ?? false,
      maxAttempts: currentConfig.maxAttempts ?? 3,
    },
  };
};

/**
 * Higher-order component that wraps a function with step-up authentication
 */
export const withStepUpAuth = <T extends unknown[]>(
  fn: (...args: T) => Promise<unknown>,
  action: string,
  description?: string,
  config?: StepUpAuthConfig
) => {
  return async (...args: T) => {
    const { requestStepUpAuth, isStepUpRequired } = useStepUpAuth();

    if (isStepUpRequired(action)) {
      const authenticated = await requestStepUpAuth(action, description, config);
      if (!authenticated) {
        throw new Error("Step-up authentication required");
      }
    }

    return fn(...args);
  };
};

/**
 * Utility function to check if an action requires step-up auth (for use outside components)
 * Note: This function reads directly from localStorage for use outside React components
 */
export const checkStepUpRequired = (action: string): boolean => {
  if (SENSITIVE_ACTIONS.includes(action as SensitiveAction)) {
    try {
      const cacheData = getLocalStorage().getItem("stepUpAuthCache");
      const parsedCache: unknown = cacheData ? JSON.parse(cacheData) : {};
      const stepUpCache = isObject(parsedCache) ? parsedCache : {};
      const authTime =
        hasProperty(stepUpCache, action) && typeof stepUpCache[action] === "number"
          ? stepUpCache[action]
          : undefined;

      if (!authTime) return true;

      return Date.now() - (authTime as number) >= DEFAULT_STEP_UP_CACHE_MS;
    } catch (error: unknown) {
      log.warn(LOG_CATEGORIES.AUTH, "Error reading step-up auth cache", error);
      return true; // Require auth if we can't read the cache
    }
  }

  return false;
};
