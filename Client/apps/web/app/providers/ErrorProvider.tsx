/**
 * Error Provider
 * Wraps the application with centralized error boundary
 */

import type { ReactNode } from "react";

import { useErrorReporting } from "packages/hooks/ui";
import { log, LOG_CATEGORIES } from "packages/logger";
import { dateNow } from "packages/utils/date";

import ErrorBoundary from "@/app/error/ErrorBoundary";

type ErrorProviderProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function ErrorProvider({ children, fallback }: ErrorProviderProps) {
  const { reportError } = useErrorReporting();

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
      reportError(error, {
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
