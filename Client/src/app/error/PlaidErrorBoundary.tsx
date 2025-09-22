/**
 * Plaid Error Boundary
 * Handles Plaid-specific errors and provides recovery options
 */

import React, { Component, ErrorInfo, ReactNode } from "react";
import Button from "../ui/button/Button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PlaidErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Plaid Error Boundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service
    if (window.reportError) {
      window.reportError(error);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Bank Connection Error
              </h2>
              <p className="text-gray-600 mb-6">
                We encountered an issue while connecting to your bank account.
                This might be due to a temporary service interruption or network
                issue.
              </p>

              <div className="space-y-3">
                <Button
                  onClick={this.handleRetry}
                  variant="primary"
                  className="w-full"
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Try Again
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                  icon={<Home className="w-4 h-4" />}
                >
                  Go to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with Plaid error boundary
export function withPlaidErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <PlaidErrorBoundary fallback={fallback}>
        <Component {...props} />
      </PlaidErrorBoundary>
    );
  };
}

// Hook for handling Plaid-specific errors
export function usePlaidErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error("Plaid Error:", error, { context });

    // Log to error reporting service
    if (window.reportError) {
      window.reportError(error);
    }
  };

  return { handleError };
}
