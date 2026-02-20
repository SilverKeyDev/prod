/**
 * Error Provider
 * Wraps the application with centralized error boundary
 */

import type { ReactNode } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { reportErrorWithCapture } from "packages/services/security/errorReporting";
import { dateNow } from "packages/utils/core/date";

import ErrorBoundary from "@/app/error/ErrorBoundary";

type ErrorProviderProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function ErrorProvider({ children, fallback }: ErrorProviderProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Log error details immediately for debugging
      log.error(LOG_CATEGORIES.ERRORS, "ErrorProvider error caught", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });

      // Additional error handling logic can go here
      reportErrorWithCapture(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: dateNow().toISOString(),
      });
    } catch (reportingError) {
      // Fail silently to prevent infinite error loops
      log.error(LOG_CATEGORIES.ERRORS, "ErrorProvider error reporting failed", {
        error:
          reportingError instanceof Error
            ? reportingError.message
            : String(reportingError),
      });
    }
  };

  return (
    <ErrorBoundary onError={handleError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorProvider;
