/**
 * Hook for Step-up Authentication
 * Provides easy integration for components requiring enhanced security
 */

import { useState, useCallback } from "react";

import { secureLogger } from "../../services";
import { isObject, hasProperty } from "../../utils/typeGuards";

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
    config?: StepUpAuthConfig,
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

export const useStepUpAuth = (): UseStepUpAuthReturn => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState("");
  const [currentDescription, setCurrentDescription] = useState<
    string | undefined
  >();
  const [currentConfig, setCurrentConfig] = useState<StepUpAuthConfig>({});
  const [resolvePromise, setResolvePromise] = useState<
    ((success: boolean) => void) | null
  >(null);

  // Use centralized localStorage hook for step-up auth cache
  const { value: stepUpCache, setValue: setStepUpCache } = useLocalStorage<
    Record<string, number>
  >("stepUpAuthCache", {});

  /**
   * Check if user has recently authenticated for this action
   */
  const isRecentlyAuthenticated = useCallback(
    (action: string): boolean => {
      const authTime = stepUpCache[action];

      if (!authTime) return false;

      const cacheTimeMs = currentConfig.cacheTimeMs ?? 15 * 60 * 1000; // Default 15 minutes

      return Date.now() - authTime < cacheTimeMs;
    },
    [stepUpCache, currentConfig.cacheTimeMs],
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
      if (
        action.includes("admin") ||
        action.includes("delete") ||
        action.includes("financial")
      ) {
        return !isRecentlyAuthenticated(action);
      }

      return false;
    },
    [isRecentlyAuthenticated],
  );

  /**
   * Request step-up authentication for an action
   */
  const requestStepUpAuth = useCallback(
    (
      action: string,
      description?: string,
      config: StepUpAuthConfig = {},
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        secureLogger.security(
          "STEP_UP_AUTH",
          "Step-up authentication requested",
          { action },
        );

        setCurrentAction(action);
        setCurrentDescription(description);
        setCurrentConfig(config);
        setResolvePromise(() => resolve);
        setIsModalOpen(true);
      });
    },
    [],
  );

  /**
   * Handle successful authentication
   */
  const handleSuccess = useCallback(() => {
    secureLogger.security(
      "STEP_UP_AUTH",
      "Step-up authentication completed successfully",
      {
        action: currentAction,
      },
    );

    // Cache successful authentication timestamp using centralized localStorage
    setStepUpCache((prev) => ({
      ...prev,
      [currentAction]: Date.now(),
    }));

    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }

    setIsModalOpen(false);
  }, [currentAction, resolvePromise, setStepUpCache]);

  /**
   * Handle authentication cancellation
   */
  const handleClose = useCallback(() => {
    secureLogger.info("STEP_UP_AUTH", "Step-up authentication cancelled", {
      action: currentAction,
    });

    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }

    setIsModalOpen(false);
  }, [currentAction, resolvePromise]);

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
  config?: StepUpAuthConfig,
) => {
  return async (...args: T) => {
    const { requestStepUpAuth, isStepUpRequired } = useStepUpAuth();

    if (isStepUpRequired(action)) {
      const authenticated = await requestStepUpAuth(
        action,
        description,
        config,
      );
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
      const cacheData = sessionStorage.getItem("stepUpAuthCache");
      const parsedCache: unknown = cacheData ? JSON.parse(cacheData) : {};
      const stepUpCache = isObject(parsedCache) ? parsedCache : {};
      const authTime =
        hasProperty(stepUpCache, action) &&
        typeof stepUpCache[action] === "number"
          ? stepUpCache[action]
          : undefined;

      if (!authTime) return true;

      const cacheTimeMs = 15 * 60 * 1000; // 15 minutes default

      return Date.now() - (authTime as number) >= cacheTimeMs;
    } catch (error: unknown) {
      console.warn("Error reading step-up auth cache:", error);
      return true; // Require auth if we can't read the cache
    }
  }

  return false;
};
