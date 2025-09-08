/**
 * Route Error Boundary for React Router
 * Handles route-specific errors with navigation options
 */

import React from 'react';
import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom';
import Card from '../../components/layout/Card';
import Button from '../../components/ui/button/Button';
import { AlertTriangle, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { reportError, normalizeError, formatErrorMessage } from './errorUtils';

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Report the route error
    reportError(error, {
      routeError: true,
      url: window.location.href,
    });
  }, [error]);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Handle React Router error responses
  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-l-4 border-l-red-500" padding="lg">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {error.status}
            </h1>
            
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              {error.status === 404 ? 'Page Not Found' : error.statusText}
            </h2>
            
            <p className="text-gray-600 mb-6">
              {error.status === 404 
                ? "The page you're looking for doesn't exist or has been moved."
                : error.data?.message || 'An error occurred while loading this page.'
              }
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleGoHome}
                icon={<Home className="w-4 h-4" />}
                className="flex-1"
              >
                Go Home
              </Button>
              <Button
                variant="outline"
                onClick={handleGoBack}
                icon={<ArrowLeft className="w-4 h-4" />}
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

  // Handle other errors
  const normalizedError = normalizeError(error);
  const userMessage = formatErrorMessage(normalizedError);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full border-l-4 border-l-red-500" padding="lg">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Route Error
          </h1>
          
          <p className="text-gray-600 mb-6">
            {userMessage}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Button
              variant="primary"
              onClick={handleRetry}
              icon={<RefreshCw className="w-4 h-4" />}
              className="flex-1"
            >
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleGoHome}
              icon={<Home className="w-4 h-4" />}
              className="flex-1"
            >
              Go Home
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default RouteErrorBoundary;
