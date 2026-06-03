/**
 * Generic React Error Boundary Wrapper
 * Centralized error handling for the entire application
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Icon } from "@ui/icons";

import { useErrorReporting } from "packages/hooks/ui";
import { log } from "packages/logger";
import type { ErrorContext } from "packages/services/security/errorReporting";
import { Box } from "packages/ui/components/primitives";
import { normalizeError } from "packages/utils/errorHandling";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Textarea, Title } from "@/components/ui";
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
type ErrorFallbackContentProps = {
  normalizedError: {
    message: string;
    stack?: string;
  };
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  feedbackMessage: string;
  feedbackSubmitted: boolean;
  onToggleDetails: () => void;
  onFeedbackMessageChange: (value: string) => void;
  onFeedbackSubmit: () => void;
  onRetry: () => void;
  onGoHome: () => void;
};
function ErrorFallbackContent({
  normalizedError,
  errorInfo,
  showDetails,
  feedbackMessage,
  feedbackSubmitted,
  onToggleDetails,
  onFeedbackMessageChange,
  onFeedbackSubmit,
  onRetry,
  onGoHome,
}: ErrorFallbackContentProps) {
  return (
    <Box className="flex min-h-[100dvh] min-w-0 items-center justify-center overflow-y-auto overflow-x-hidden overscroll-y-contain bg-background-base pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pl-[calc(1.5rem+env(safe-area-inset-left,0px))] sm:pr-[calc(1.5rem+env(safe-area-inset-right,0px))] sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))] md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] md:pl-[calc(2rem+env(safe-area-inset-left,0px))] md:pr-[calc(2rem+env(safe-area-inset-right,0px))] md:pt-[calc(2rem+env(safe-area-inset-top,0px))] lg:pb-[calc(3rem+env(safe-area-inset-bottom,0px))] lg:pl-[calc(3rem+env(safe-area-inset-left,0px))] lg:pr-[calc(3rem+env(safe-area-inset-right,0px))] lg:pt-[calc(3rem+env(safe-area-inset-top,0px))]">
      <Card
        border="none"
        className="w-full min-w-0 max-w-2xl border-l-4 border-l-destructive shadow-lg"
        padding="lg"
      >
        <Box className="text-center">
          <Title size="lg" as="h1" className="mb-responsive-xs text-text-primary">
            Something went wrong
          </Title>

          <BodyText size="sm" muted className="mb-responsive-md text-balance break-words">
            We're sorry, but something unexpected happened. Our team has been notified and we're
            working to resolve this issue.
          </BodyText>

          <Box className="gap-responsive-xs mb-responsive-md flex w-full min-w-0 flex-row">
            <Button
              variant="primary"
              onClick={onRetry}
              contentAlign="start"
              collapseIconWhenNarrow={false}
              icon={<Icon name="refresh-cw" className="mobile-icon-xs flex-shrink-0" />}
              className="min-w-0 flex-1 touch-manipulation"
              label="Try Again"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={onGoHome}
              contentAlign="start"
              collapseIconWhenNarrow={false}
              icon={<Icon name="home" className="mobile-icon-xs flex-shrink-0" />}
              className="min-w-0 flex-1 touch-manipulation"
              label="Go Home"
            >
              Go Home
            </Button>
          </Box>

          <ErrorDetailsSection
            normalizedError={normalizedError}
            errorInfo={errorInfo}
            showDetails={showDetails}
            onToggleDetails={onToggleDetails}
          />

          <ErrorFeedbackSection
            feedbackMessage={feedbackMessage}
            feedbackSubmitted={feedbackSubmitted}
            onFeedbackMessageChange={onFeedbackMessageChange}
            onFeedbackSubmit={onFeedbackSubmit}
          />
        </Box>
      </Card>
    </Box>
  );
}
function ErrorDetailsSection({
  normalizedError,
  errorInfo,
  showDetails,
  onToggleDetails,
}: {
  normalizedError: {
    message: string;
    stack?: string;
  };
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  onToggleDetails: () => void;
}) {
  return (
    <Box className="min-w-0 text-left">
      <Button
        variant="ghost"
        size="sm"
        contentAlign="start"
        onClick={onToggleDetails}
        className="mb-responsive-xs w-full text-destructive hover:text-destructive-hover sm:w-auto"
      >
        {showDetails ? "Hide" : "Show"} Error Details
      </Button>
      {showDetails && (
        <Card
          border="light"
          className="mb-responsive-sm border-border bg-background-surface"
          padding="sm"
        >
          <Box className="text-responsive-xs font-mono text-text-secondary">
            <Box className="mb-responsive-xs">
              <strong className="text-text-primary">Error:</strong> {normalizedError.message}
            </Box>
            {normalizedError.stack && (
              <Box className="mb-responsive-xs">
                <strong className="text-text-primary">Stack:</strong>
                <pre className="p-responsive-xs mt-1 overflow-x-auto whitespace-pre-wrap rounded border bg-background-surface text-xs">
                  {normalizedError.stack}
                </pre>
              </Box>
            )}
            {errorInfo?.componentStack && (
              <Box>
                <strong className="text-text-primary">Component Stack:</strong>
                <pre className="p-responsive-xs mt-1 overflow-x-auto whitespace-pre-wrap rounded border bg-background-surface text-xs">
                  {errorInfo.componentStack}
                </pre>
              </Box>
            )}
          </Box>
        </Card>
      )}
    </Box>
  );
}
function ErrorFeedbackSection({
  feedbackMessage,
  feedbackSubmitted,
  onFeedbackMessageChange,
  onFeedbackSubmit,
}: {
  feedbackMessage: string;
  feedbackSubmitted: boolean;
  onFeedbackMessageChange: (value: string) => void;
  onFeedbackSubmit: () => void;
}) {
  return (
    <Card border="light" className="border-border bg-primary-muted" padding="md">
      <Box className="min-w-0 text-left">
        <Box className="mb-responsive-xs gap-responsive-xs flex min-w-0 flex-row items-center">
          <Icon name="message-square" className="mobile-icon-sm flex-shrink-0 text-primary" />
          <Title size="sm" as="h3" className="mb-0 flex-1 text-text-primary">
            Help us improve
          </Title>
        </Box>
        {!feedbackSubmitted ? (
          <Box>
            <Textarea
              value={feedbackMessage}
              onChange={(e) => onFeedbackMessageChange(e.target.value)}
              placeholder="What were you doing before this error? (optional)"
              className="p-responsive-xs text-responsive-xs focus:border-input-variant-focus-border w-full resize-none rounded-lg border border-border bg-background-surface font-sans focus:ring-2 focus:ring-neutral-300"
              rows={3}
            />
            <Box className="mt-responsive-sm flex w-full justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={onFeedbackSubmit}
                contentAlign="start"
                collapseIconWhenNarrow={false}
                disabled={!feedbackMessage.trim()}
                iconName="send"
                className="min-h-touch shrink-0"
                label="Send Feedback"
              >
                Send Feedback
              </Button>
            </Box>
          </Box>
        ) : (
          <BodyText size="xs" className="text-primary">
            Thank you for your feedback! This helps us fix the issue.
          </BodyText>
        )}
      </Box>
    </Card>
  );
}
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
    // Log error details for debugging
    log.error("ERRORS", "ErrorBoundary caught error", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    // Report error using centralized error reporting
    this.props.reportError?.(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      errorBoundary: true,
    });
    // Call optional onError callback
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
    window.location.href = "/";
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
        <ErrorFallbackContent
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

/**
 * Wrapper component that provides error reporting hook to class-based ErrorBoundary
 * This follows the architecture rule: components use hooks, not services directly
 */
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
