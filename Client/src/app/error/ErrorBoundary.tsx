/**
 * Generic React Error Boundary Wrapper
 * Centralized error handling for the entire application
 */

import { Component, ErrorInfo, ReactNode } from "react";
import Card from "../../components/layout/Card";
import Button from "../../components/ui/button/Button";
import { AlertTriangle, RefreshCw, MessageSquare, Home } from "lucide-react";
import { reportError, normalizeError } from "./errorUtils.ts";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  feedbackMessage: string;
  feedbackSubmitted: boolean;
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
      reportError(this.state.error || new Error("User feedback"), {
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
        <div className="min-h-screen bg-off-white flex items-center justify-center px-responsive-lg py-responsive-lg">
          <Card
            className="max-w-2xl w-full border-l-4 border-l-brown shadow-lg"
            padding="lg"
          >
            <div className="text-center">
              <div className="flex justify-center mb-responsive-md">
                <div className="p-responsive-sm bg-brown/10 rounded-full">
                  <AlertTriangle className="mobile-icon-lg text-brown" />
                </div>
              </div>

              <h1 className="heading-responsive-md font-serif text-navy mb-responsive-xs">
                Something went wrong
              </h1>

              <p className="text-responsive-sm text-neutral-600 mb-responsive-md font-sans">
                We're sorry, but something unexpected happened. Our team has
                been notified and we're working to resolve this issue.
              </p>

              <div className="flex flex-col sm:flex-row gap-responsive-xs mb-responsive-md">
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
                    className="bg-neutral-50 border-neutral-200 mb-responsive-sm"
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
                          <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap bg-white p-responsive-xs rounded border">
                            {normalizedError.stack}
                          </pre>
                        </div>
                      )}
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <strong className="text-navy">
                            Component Stack:
                          </strong>
                          <pre className="mt-1 text-xs overflow-x-auto whitespace-pre-wrap bg-white p-responsive-xs rounded border">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              {/* User Feedback */}
              <Card className="bg-olive/10 border-olive/20" padding="md">
                <div className="flex items-start space-responsive-xs">
                  <MessageSquare className="mobile-icon-sm text-olive mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-responsive-sm font-serif font-semibold text-navy mb-responsive-xs">
                      Help us improve
                    </h3>
                    {!this.state.feedbackSubmitted ? (
                      <div>
                        <textarea
                          value={this.state.feedbackMessage}
                          onChange={(e) =>
                            this.setState({ feedbackMessage: e.target.value })
                          }
                          placeholder="What were you trying to do when this error occurred?"
                          className="w-full p-responsive-xs text-responsive-xs border border-olive/30 rounded-lg resize-none bg-white focus:border-olive focus:ring-2 focus:ring-olive/20 font-sans"
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
                      <p className="text-responsive-xs text-olive font-sans">
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
