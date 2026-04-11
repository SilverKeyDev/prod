/**
 * Secure Logger Hook
 * Provides access to secure logging functionality for UI components
 *
 * Architecture: Components in apps/web/ must use this hook instead of
 * importing services/security/secureLogger directly
 */

import { useCallback } from "react";

import { secureLogger } from "packages/services/security/secureLogger";

export function useSecureLogger() {
  const debug = useCallback(
    (scope: string, message: string, data?: unknown) => {
      secureLogger.debug(scope, message, data);
    },
    [],
  );

  const info = useCallback((scope: string, message: string, data?: unknown) => {
    secureLogger.info(scope, message, data);
  }, []);

  const warn = useCallback((scope: string, message: string, data?: unknown) => {
    secureLogger.warn(scope, message, data);
  }, []);

  const error = useCallback(
    (scope: string, message: string, errorData?: unknown) => {
      secureLogger.error(scope, message, errorData);
    },
    [],
  );

  const security = useCallback(
    (scope: string, event: string, data?: unknown) => {
      secureLogger.security(scope, event, data);
    },
    [],
  );

  return {
    debug,
    info,
    warn,
    error,
    security,
  };
}
