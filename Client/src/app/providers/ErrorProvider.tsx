/**
 * Error Provider
 * Wraps the application with centralized error boundary
 */

import React, { ReactNode } from "react";
import ErrorBoundary from "../error/ErrorBoundary";
import { reportError } from "../error/errorUtils";

interface ErrorProviderProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorProvider({ children, fallback }: ErrorProviderProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Additional error handling logic can go here
    reportError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <ErrorBoundary onError={handleError} fallback={fallback}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorProvider;
