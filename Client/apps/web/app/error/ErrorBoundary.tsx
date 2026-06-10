/**
 * Generic React Error Boundary Wrapper
 * Centralized error handling for the entire application
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

import { useErrorReporting } from "packages/hooks/ui";
import { log } from "packages/logger";
import type { ErrorContext } from "packages/services/security/errorReporting";
import { ErrorBoundaryFallback } from "packages/ui/components/system/error/ErrorBoundaryFallback.web";
import { normalizeError } from "packages/utils/core/errorHandling";
import { getWindow } from "packages/utils/core/platform";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  reportError?: (error: unknown, context?: ErrorContext) => void;
};
type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  feedbackMessage: string;
  feedbackSubmitted: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      feedbackMessage: "",
      feedbackSubmitted: false,
    };
  }
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    log.error("ERRORS", "ErrorBoundary caught error", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.props.reportError?.(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      errorBoundary: true,
    });
    this.props.onError?.(error, errorInfo);
  }
  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      feedbackMessage: "",
      feedbackSubmitted: false,
    });
  };
  handleGoHome = () => {
    const win = getWindow();
    if (win) {
      win.location.href = "/";
    }
  };
  handleToggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };
  handleFeedbackSubmit = () => {
    if (this.state.feedbackMessage.trim()) {
      this.props.reportError?.(this.state.error ?? new Error("User feedback"), {
        userFeedback: true,
        feedbackMessage: this.state.feedbackMessage,
        errorBoundary: true,
      });
      this.setState({ feedbackSubmitted: true });
    }
  };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const normalizedError = normalizeError(this.state.error);
      return (
        <ErrorBoundaryFallback
          normalizedError={normalizedError}
          errorInfo={this.state.errorInfo}
          showDetails={this.state.showDetails}
          feedbackMessage={this.state.feedbackMessage}
          feedbackSubmitted={this.state.feedbackSubmitted}
          onToggleDetails={this.handleToggleDetails}
          onFeedbackMessageChange={(value) => this.setState({ feedbackMessage: value })}
          onFeedbackSubmit={this.handleFeedbackSubmit}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }
    return this.props.children;
  }
}

export function ErrorBoundaryWithReporting({
  children,
  fallback,
  onError,
}: Omit<Props, "reportError">) {
  const { reportError } = useErrorReporting();

  return (
    <ErrorBoundary fallback={fallback} onError={onError} reportError={reportError}>
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundaryWithReporting;
