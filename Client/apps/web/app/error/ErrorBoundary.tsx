/**
 * Generic React Error Boundary Wrapper
 * Centralized error handling for the entire application
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Icon } from "@ui/icons";

import { log, LOG_CATEGORIES } from "packages/logger";
import { reportErrorWithCapture } from "packages/services/security/errorReporting";
import { normalizeError } from "packages/utils/errorHandling";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";
type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
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
    <div className="px-responsive-lg py-responsive-lg flex min-h-screen items-center justify-center bg-off-white">
      <Card className="w-full max-w-2xl border-l-4 border-l-brown shadow-lg" padding="lg">
        <div className="text-center">
          <div className="mb-responsive-md flex justify-center">
            <div className="p-responsive-sm rounded-full bg-brown/10">
              <Icon name="alert-triangle" className="mobile-icon-lg text-brown" />
            </div>
          </div>

          <Title size="xl" as="h1" className="mb-responsive-xs text-navy">
            Something went wrong
          </Title>

          <BodyText size="sm" muted className="mb-responsive-md">
            We're sorry, but something unexpected happened. Our team has been notified and we're
            working to resolve this issue.
          </BodyText>

          <div className="gap-responsive-xs mb-responsive-md flex flex-col sm:flex-row">
            <Button
              variant="primary"
              onClick={onRetry}
              icon={<Icon name="refresh-cw" className="mobile-icon-xs" />}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={onGoHome}
              icon={<Icon name="home" className="mobile-icon-xs" />}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>

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
        </div>
      </Card>
    </div>
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
    <div className="text-left">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleDetails}
        className="mb-responsive-xs text-brown hover:text-brown/80"
      >
        {showDetails ? "Hide" : "Show"} Error Details
      </Button>
      {showDetails && (
        <Card className="mb-responsive-sm border-neutral-200 bg-neutral-50" padding="sm">
          <div className="text-responsive-xs font-mono text-neutral-700">
            <div className="mb-responsive-xs">
              <strong className="text-navy">Error:</strong> {normalizedError.message}
            </div>
            {normalizedError.stack && (
              <div className="mb-responsive-xs">
                <strong className="text-navy">Stack:</strong>
                <pre className="p-responsive-xs mt-1 overflow-x-auto whitespace-pre-wrap rounded border bg-white text-xs">
                  {normalizedError.stack}
                </pre>
              </div>
            )}
            {errorInfo?.componentStack && (
              <div>
                <strong className="text-navy">Component Stack:</strong>
                <pre className="p-responsive-xs mt-1 overflow-x-auto whitespace-pre-wrap rounded border bg-white text-xs">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
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
    <Card className="border-olive/20 bg-olive/10" padding="md">
      <div className="space-responsive-xs flex items-start">
        <Icon name="message-square" className="mobile-icon-sm mt-0.5 flex-shrink-0 text-olive" />
        <div className="flex-1">
          <Title size="sm" as="h3" className="mb-responsive-xs text-navy">
            Help us improve
          </Title>
          {!feedbackSubmitted ? (
            <div>
              <textarea
                value={feedbackMessage}
                onChange={(e) => onFeedbackMessageChange(e.target.value)}
                placeholder="What were you trying to do when this error occurred?"
                className="p-responsive-xs text-responsive-xs w-full resize-none rounded-lg border border-olive/30 bg-white font-sans focus:border-olive focus:ring-2 focus:ring-olive/20"
                rows={3}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={onFeedbackSubmit}
                className="mt-responsive-xs"
                disabled={!feedbackMessage.trim()}
              >
                Send Feedback
              </Button>
            </div>
          ) : (
            <BodyText size="xs" className="text-olive">
              Thank you for your feedback! This helps us fix the issue.
            </BodyText>
          )}
        </div>
      </div>
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
    log.error(LOG_CATEGORIES.ERRORS, "ErrorBoundary caught error", {
      message: error.message,
      name: error.name,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    // Report error using centralized error reporting
    reportErrorWithCapture(error, {
      componentStack: errorInfo.componentStack,
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
      reportErrorWithCapture(this.state.error ?? new Error("User feedback"), {
        userFeedback: this.state.feedbackMessage,
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
export default ErrorBoundary;
