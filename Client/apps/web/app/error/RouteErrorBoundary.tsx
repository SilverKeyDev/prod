/**
 * Route Error Boundary for React Router
 * Handles route-specific errors with navigation options
 */
import { useEffect } from "react";

import { Icon } from "@ui/icons";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router-dom";

import { reportErrorWithCapture } from "packages/services/security/errorReporting";
import { Box } from "packages/ui/components/primitives";
import { getUserFriendlyMessage, normalizeError } from "packages/utils/errorHandling";

import Card from "@/components/layout/Card.web";
import { BodyText, Button, Title } from "@/components/ui";
type RouteErrorResponseViewProps = {
  status: number;
  statusText: string;
  message: string;
  onGoHome: () => void;
  onGoBack: () => void;
};
function RouteErrorResponseView({
  status,
  statusText,
  message,
  onGoHome,
  onGoBack,
}: RouteErrorResponseViewProps) {
  return (
    <Box className="flex min-h-screen items-center justify-center bg-background-base p-4">
      <Card className="w-full max-w-lg border-l-4 border-l-destructive" padding="lg">
        <Box className="text-center">
          <Box className="mb-4 flex justify-center">
            <Box className="rounded-full border-2 border-destructive bg-background-surface p-3">
              <Icon name="alert-triangle" className="h-8 w-8 text-destructive" />
            </Box>
          </Box>
          <Title size="xl" as="h1" className="mb-2 text-text-primary">
            {status}
          </Title>
          <Title size="lg" as="h2" className="mb-4 text-text-secondary">
            {status === 404 ? "Page Not Found" : statusText}
          </Title>
          <BodyText size="sm" muted className="mb-6">
            {message}
          </BodyText>
          <Box className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={onGoHome}
              icon={<Icon name="home" className="h-4 w-4" />}
              className="flex-1"
            >
              Go Home
            </Button>
            <Button
              variant="outline"
              onClick={onGoBack}
              icon={<Icon name="arrow-left" className="h-4 w-4" />}
              className="flex-1"
            >
              Go Back
            </Button>
          </Box>
        </Box>
      </Card>
    </Box>
  );
}
type GenericRouteErrorViewProps = {
  userMessage: string;
  onRetry: () => void;
  onGoHome: () => void;
  onGoBack: () => void;
};
function GenericRouteErrorView({
  userMessage,
  onRetry,
  onGoHome,
  onGoBack,
}: GenericRouteErrorViewProps) {
  return (
    <Box className="flex min-h-screen items-center justify-center bg-background-base p-4">
      <Card className="w-full max-w-lg border-l-4 border-l-destructive" padding="lg">
        <Box className="text-center">
          <Box className="mb-4 flex justify-center">
            <Box className="rounded-full border-2 border-destructive bg-background-surface p-3">
              <Icon name="alert-triangle" className="h-8 w-8 text-destructive" />
            </Box>
          </Box>
          <Title size="lg" as="h1" className="mb-2 text-text-primary">
            Route Error
          </Title>
          <BodyText size="sm" muted className="mb-6">
            {userMessage}
          </BodyText>
          <Box className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={onRetry}
              icon={<Icon name="refresh-cw" className="h-4 w-4" />}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={onGoHome}
              icon={<Icon name="home" className="h-4 w-4" />}
              className="flex-1"
            >
              Go Home
            </Button>
          </Box>
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            icon={<Icon name="arrow-left" className="h-4 w-4" />}
          >
            Go Back
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  useEffect(() => {
    reportErrorWithCapture(error, {
      routeError: true,
      url: window.location.href,
    });
  }, [error]);
  const handleGoBack = () => {
    void navigate(-1);
  };
  const handleGoHome = () => {
    void navigate("/");
  };
  const handleRetry = () => {
    window.location.reload();
  };
  if (isRouteErrorResponse(error)) {
    const message =
      error.status === 404
        ? "The page you're looking for doesn't exist or has been moved."
        : ((
            error.data as {
              message?: string;
            }
          )?.message ?? "An error occurred while loading this page.");
    return (
      <RouteErrorResponseView
        status={error.status}
        statusText={error.statusText}
        message={message}
        onGoHome={handleGoHome}
        onGoBack={handleGoBack}
      />
    );
  }
  const normalizedError = normalizeError(error);
  const userMessage = getUserFriendlyMessage(normalizedError);
  return (
    <GenericRouteErrorView
      userMessage={userMessage}
      onRetry={handleRetry}
      onGoHome={handleGoHome}
      onGoBack={handleGoBack}
    />
  );
}
export default RouteErrorBoundary;
