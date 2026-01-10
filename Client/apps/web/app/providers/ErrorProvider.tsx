/**
 * Error Provider
 * Wraps the application with centralized error boundary
 */

import type { ReactNode } from "react";

import ErrorBoundary from "../error/ErrorBoundary";
import { reportError } from "../../../../packages/utils/errorHandling";

type ErrorProviderProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

export function ErrorProvider({ children, fallback }: ErrorProviderProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      // Log error details immediately for debugging
      console.error("[ErrorProvider] Error caught:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });

      // Additional error handling logic can go here
      reportError(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: new Date().toISOString(),
      });
    } catch (reportingError) {
      // Fail silently to prevent infinite error loops
      console.error(
        "[ErrorProvider] Error reporting failed:",
        reportingError instanceof Error
          ? reportingError.message
          : String(reportingError)
      );
    }
  };

  return (
    <ErrorBoundary onError={handleError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorProvider;
