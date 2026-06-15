/**
 * Error Provider for React Native. Wraps app with ErrorBoundaryNative.
 * Pass onGoHome (e.g. navigation.reset) from root when navigation is available.
 */

import type { ReactNode } from "react";

import { reportErrorBoundary } from "packages/utils/core/errorHandling";

import { ErrorBoundaryNative } from "../error/ErrorBoundaryNative.native";

type ErrorProviderNativeProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onGoHome?: () => void;
};

export function ErrorProviderNative({ children, fallback, onGoHome }: ErrorProviderNativeProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    reportErrorBoundary(error, {
      componentStack: errorInfo.componentStack,
    });
  };

  return (
    <ErrorBoundaryNative onError={handleError} fallback={fallback} onGoHome={onGoHome}>
      {children}
    </ErrorBoundaryNative>
  );
}
