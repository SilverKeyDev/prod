/**
 * Generic React Error Boundary Wrapper
 * Centralized error handling for the entire application
 */

import { AlertTriangle, RefreshCw, MessageSquare, Home } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import Card from "../../components/layout/Card.tsx";
import Button from "../../components/ui/button/Button.tsx";

import {
  reportError,
  normalizeError,
} from "../../../../packages/utils/errorHandling";
import { log, LOG_CATEGORIES } from "../../../../logger";

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
    reportError(error, {
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
      reportError(this.state.error ?? new Error("User feedback"), {
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
        <div className="px-responsive-lg py-responsive-lg flex min-h-screen items-center justify-center bg-off-white">
          <Card
            className="w-full max-w-2xl border-l-4 border-l-brown shadow-lg"
            padding="lg"
          >
            <div className="text-center">
              <div className="mb-responsive-md flex justify-center">
                <div className="p-responsive-sm rounded-full bg-brown/10">
                  <AlertTriangle className="mobile-icon-lg text-brown" />
                </div>
              </div>

              <h1 className="heading-responsive-md mb-responsive-xs font-serif text-navy">
                Something went wrong
              </h1>

              <p className="text-responsive-sm mb-responsive-md font-sans text-neutral-600">
                We're sorry, but something unexpected happened. Our team has
                been notified and we're working to resolve this issue.
              </p>

              <div className="gap-responsive-xs mb-responsive-md flex flex-col sm:flex-row">
                <Button
                  variant="primary"
                  onClick={this.handleRetry}
                  icon={<RefreshCw className="mobile-icon-xs" />}
                  className="flex-1"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  icon={<Home className="mobile-icon-xs" />}
                  className="flex-1"
                >
                  Go Home
                </Button>
              </div>

              {/* Error Details */}
              <div className="text-left">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleToggleDetails}
                  className="mb-responsive-xs text-brown hover:text-brown/80"
                >
                  {this.state.showDetails ? "Hide" : "Show"} Error Details
                </Button>

                {this.state.showDetails && (
                  <Card
                    className="mb-responsive-sm border-neutral-200 bg-neutral-50"
                    padding="sm"
                  >
                    <div className="text-responsive-xs font-mono text-neutral-700">
                      <div className="mb-responsive-xs">
                        <strong className="text-navy">Error:</strong>{" "}
                        {normalizedError.message}
                      </div>
                      {normalizedError.stack && (
                        <div className="mb-responsive-xs">
                          <strong className="text-navy">Stack:</strong>
                          <pre className="p-responsive-xs mt-1 overflow-x-auto whitespace-pre-wrap rounded border bg-white text-xs">
                            {normalizedError.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-navy">
                            Component Stack:
                          </strong>
                          <pre className="p-responsive-xs mt-1 overflow-x-auto whitespace-pre-wrap rounded border bg-white text-xs">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* User Feedback */}
              <Card className="border-olive/20 bg-olive/10" padding="md">
                <div className="space-responsive-xs flex items-start">
                  <MessageSquare className="mobile-icon-sm mt-0.5 flex-shrink-0 text-olive" />
                  <div className="flex-1">
                    <h3 className="text-responsive-sm mb-responsive-xs font-serif font-semibold text-navy">
                      Help us improve
                    </h3>
                    {!this.state.feedbackSubmitted ? (
                      <div>
                        <textarea
                          value={this.state.feedbackMessage}
                          onChange={(
                            e: React.ChangeEvent<HTMLTextAreaElement>,
                          ) =>
                            this.setState({ feedbackMessage: e.target.value })
                          }
                          placeholder="What were you trying to do when this error occurred?"
                          className="p-responsive-xs text-responsive-xs w-full resize-none rounded-lg border border-olive/30 bg-white font-sans focus:border-olive focus:ring-2 focus:ring-olive/20"
                          rows={3}
                        />
                        <Button
                          variant="olive"
                          size="sm"
                          onClick={this.handleFeedbackSubmit}
                          className="mt-responsive-xs"
                          disabled={!this.state.feedbackMessage.trim()}
                        >
                          Send Feedback
                        </Button>
                      </div>
                    ) : (
                      <p className="text-responsive-xs font-sans text-olive">
                        Thank you for your feedback! This helps us fix the
                        issue.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
