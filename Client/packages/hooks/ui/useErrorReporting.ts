/**
 * Error Reporting Hook
 * Provides access to error reporting functionality for UI components
 *
 * Architecture: Components in apps/web/ must use this hook instead of
 * importing services/security/errorReporting directly
 */

import { useCallback } from "react";

import type { ErrorContext } from "packages/services/security/errorReporting";
import { reportErrorWithCapture } from "packages/services/security/errorReporting";

export function useErrorReporting() {
  const reportError = useCallback((error: unknown, context?: ErrorContext) => {
    reportErrorWithCapture(error, context);
  }, []);

  return {
    reportError,
  };
}
