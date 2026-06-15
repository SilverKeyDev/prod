import { Icon } from "@ui/icons";
import Card from "@ui/layout/Card.web";
import type { ErrorInfo } from "react";

import { BodyText, Button, Textarea, Title } from "packages/ui";
import { Box } from "packages/ui/components/structure/primitives";

export type ErrorBoundaryFallbackProps = {
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

export function ErrorBoundaryFallback({
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
}: ErrorBoundaryFallbackProps) {
  return (
    <Box className="bg-background-base flex min-h-[100dvh] min-w-0 items-center justify-center overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pl-[calc(1.5rem+env(safe-area-inset-left,0px))] sm:pr-[calc(1.5rem+env(safe-area-inset-right,0px))] sm:pt-[calc(1.5rem+env(safe-area-inset-top,0px))] md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] md:pl-[calc(2rem+env(safe-area-inset-left,0px))] md:pr-[calc(2rem+env(safe-area-inset-right,0px))] md:pt-[calc(2rem+env(safe-area-inset-top,0px))] lg:pb-[calc(3rem+env(safe-area-inset-bottom,0px))] lg:pl-[calc(3rem+env(safe-area-inset-left,0px))] lg:pr-[calc(3rem+env(safe-area-inset-right,0px))] lg:pt-[calc(3rem+env(safe-area-inset-top,0px))]">
      <Card
        border="none"
        className="border-l-destructive w-full min-w-0 max-w-2xl border-l-4 shadow-lg"
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
        className="mb-responsive-xs text-destructive hover:text-destructive-hover w-full sm:w-auto"
      >
        {showDetails ? "Hide" : "Show"} Error Details
      </Button>
      {showDetails && (
        <Card
          border="light"
          className="mb-responsive-sm border-border bg-background-surface"
          padding="sm"
        >
          <Box className="text-responsive-xs text-text-secondary font-mono">
            <Box className="mb-responsive-xs">
              <strong className="text-text-primary">Error:</strong> {normalizedError.message}
            </Box>
            {normalizedError.stack && (
              <Box className="mb-responsive-xs">
                <strong className="text-text-primary">Stack:</strong>
                <pre className="p-responsive-xs bg-background-surface mt-1 overflow-x-auto whitespace-pre-wrap rounded border text-xs">
                  {normalizedError.stack}
                </pre>
              </Box>
            )}
            {errorInfo?.componentStack && (
              <Box>
                <strong className="text-text-primary">Component Stack:</strong>
                <pre className="p-responsive-xs bg-background-surface mt-1 overflow-x-auto whitespace-pre-wrap rounded border text-xs">
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
          <Icon name="message-square" className="mobile-icon-sm text-primary flex-shrink-0" />
          <Title size="sm" as="h3" className="text-text-primary mb-0 flex-1">
            Help us improve
          </Title>
        </Box>
        {!feedbackSubmitted ? (
          <Box>
            <Textarea
              value={feedbackMessage}
              onChange={(e) => onFeedbackMessageChange(e.target.value)}
              placeholder="What were you doing before this error? (optional)"
              className="p-responsive-xs text-responsive-xs focus:border-input-variant-focus-border border-border bg-background-surface w-full resize-none rounded-lg border font-sans focus:ring-2 focus:ring-neutral-300"
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
