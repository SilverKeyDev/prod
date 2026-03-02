/**
 * Error Provider for React Native. Wraps app with ErrorBoundaryNative.
 * Pass onGoHome (e.g. navigation.reset) from root when navigation is available.
 */

import type { ReactNode } from "react";

import { log, LOG_CATEGORIES } from "packages/logger";
import { reportErrorWithCapture } from "packages/services/security/errorReporting";
import { dateNow } from "packages/utils/date";

import { ErrorBoundaryNative } from "../error/ErrorBoundaryNative.native";

type ErrorProviderNativeProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onGoHome?: () => void;
};

export function ErrorProviderNative({ children, fallback, onGoHome }: ErrorProviderNativeProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    try {
      log.error(LOG_CATEGORIES.ERRORS, "ErrorProviderNative error caught", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
      reportErrorWithCapture(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: dateNow().toISOString(),
      });
    } catch (reportingError) {
      log.error(LOG_CATEGORIES.ERRORS, "ErrorProvider error reporting failed", {
        error: reportingError instanceof Error ? reportingError.message : String(reportingError),
      });
    }
  };

  return (
    <ErrorBoundaryNative onError={handleError} fallback={fallback} onGoHome={onGoHome}>
      {children}
    </ErrorBoundaryNative>
  );
}
