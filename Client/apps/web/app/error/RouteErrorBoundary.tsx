/**
 * Route Error Boundary for React Router
 * Handles route-specific errors with navigation options
 */

import { useEffect } from "react";

import { AlertTriangle, ArrowLeft, Home, RefreshCw } from "lucide-react";
import {
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from "react-router-dom";

import { reportErrorWithCapture } from "packages/services/security/errorReporting";
import {
  getUserFriendlyMessage,
  normalizeError,
} from "packages/utils/core/errorHandling";

import Card from "@/components/layout/Card.web";
import Button from "@/components/ui/button/Button";

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card
        className="w-full max-w-lg border-l-4 border-l-red-500"
        padding="lg"
      >
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">{status}</h1>
          <h2 className="mb-4 text-xl font-semibold text-gray-700">
            {status === 404 ? "Page Not Found" : statusText}
          </h2>
          <p className="mb-6 text-gray-600">{message}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={onGoHome}
              icon={<Home className="h-4 w-4" />}
              className="flex-1"
            >
              Go Home
            </Button>
            <Button
              variant="outline"
              onClick={onGoBack}
              icon={<ArrowLeft className="h-4 w-4" />}
              className="flex-1"
            >
              Go Back
            </Button>
          </div>
        </div>
      </Card>
    </div>
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card
        className="w-full max-w-lg border-l-4 border-l-red-500"
        padding="lg"
      >
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Route Error</h1>
          <p className="mb-6 text-gray-600">{userMessage}</p>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              onClick={onRetry}
              icon={<RefreshCw className="h-4 w-4" />}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={onGoHome}
              icon={<Home className="h-4 w-4" />}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            icon={<ArrowLeft className="h-4 w-4" />}
          >
            Go Back
          </Button>
        </div>
      </Card>
    </div>
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
        : ((error.data as { message?: string })?.message ??
          "An error occurred while loading this page.");
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
