/**
 * Centralized Error Handling Utilities
 * Builds upon existing error handling patterns and provides consistent error management
 */

import React from "react";
import {
  extractErrorDetails,
  isApiError,
  isError,
  isErrorLike,
  isObject,
  isString,
} from "./typeGuards";

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

export type StandardError = {
  message: string;
  code?: string | number;
  name?: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  id: string;
};

export type ValidationError = StandardError & {
  name: "ValidationError";
  field?: string;
  fieldErrors?: Record<string, string>;
};

export type NetworkError = StandardError & {
  name: "NetworkError";
  status?: number;
  statusText?: string;
  url?: string;
};

export type AuthenticationError = StandardError & {
  name: "AuthenticationError";
  requiresReauth?: boolean;
};

export type AuthorizationError = StandardError & {
  name: "AuthorizationError";
  requiredPermission?: string;
};

export type BusinessLogicError = StandardError & {
  name: "BusinessLogicError";
  operation?: string;
};

export type AppError =
  | ValidationError
  | NetworkError
  | AuthenticationError
  | AuthorizationError
  | BusinessLogicError
  | StandardError;

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a standardized error object
 * @param message - Error message
 * @param options - Additional error options
 * @returns Standardized error object
 */
export function createError(
  message: string,
  options: {
    code?: string | number;
    name?: string;
    context?: Record<string, unknown>;
    stack?: string;
  } = {},
): StandardError {
  return {
    message,
    code: options.code,
    name: options.name || "StandardError",
    stack: options.stack,
    context: options.context,
    timestamp: new Date().toISOString(),
    id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  };
}

/**
 * Creates a validation error
 * @param message - Error message
 * @param field - Field that failed validation
 * @param fieldErrors - Additional field-specific errors
 * @returns Validation error object
 */
export function createValidationError(
  message: string,
  field?: string,
  fieldErrors?: Record<string, string>,
): ValidationError {
  return {
    ...createError(message, { name: "ValidationError" }),
    name: "ValidationError" as const,
    field,
    fieldErrors,
  };
}

/**
 * Creates a network error
 * @param message - Error message
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param url - Request URL
 * @returns Network error object
 */
export function createNetworkError(
  message: string,
  status?: number,
  statusText?: string,
  url?: string,
): NetworkError {
  return {
    ...createError(message, { name: "NetworkError" }),
    name: "NetworkError" as const,
    status,
    statusText,
    url,
  };
}

/**
 * Creates an authentication error
 * @param message - Error message
 * @param requiresReauth - Whether re-authentication is required
 * @returns Authentication error object
 */
export function createAuthenticationError(
  message: string,
  requiresReauth = false,
): AuthenticationError {
  return {
    ...createError(message, { name: "AuthenticationError" }),
    name: "AuthenticationError" as const,
    requiresReauth,
  };
}

/**
 * Creates an authorization error
 * @param message - Error message
 * @param requiredPermission - Required permission
 * @returns Authorization error object
 */
export function createAuthorizationError(
  message: string,
  requiredPermission?: string,
): AuthorizationError {
  return {
    ...createError(message, { name: "AuthorizationError" }),
    name: "AuthorizationError" as const,
    requiredPermission,
  };
}

/**
 * Creates a business logic error
 * @param message - Error message
 * @param operation - Operation that failed
 * @returns Business logic error object
 */
export function createBusinessLogicError(
  message: string,
  operation?: string,
): BusinessLogicError {
  return {
    ...createError(message, { name: "BusinessLogicError" }),
    name: "BusinessLogicError" as const,
    operation,
  };
}

// ============================================================================
// ERROR NORMALIZATION
// ============================================================================

/**
 * Normalizes any error into a standardized format
 * @param error - The error to normalize
 * @param context - Additional context
 * @returns Normalized error object
 */
export function normalizeError(
  error: unknown,
  context?: Record<string, unknown>,
): AppError {
  // Handle already normalized errors
  if (isObject(error) && "id" in error && "timestamp" in error) {
    return error as AppError;
  }

  // Handle API errors
  if (isApiError(error)) {
    return createNetworkError(
      error.message || error.error,
      undefined,
      undefined,
      context?.url as string,
    );
  }

  // Handle standard Error objects
  if (isError(error)) {
    const details = extractErrorDetails(error);

    // Try to classify the error type based on name or message
    if (
      error.name === "ValidationError" ||
      details.message.includes("validation")
    ) {
      return createValidationError(details.message, undefined, undefined);
    }

    if (error.name === "TypeError" || error.name === "ReferenceError") {
      return createBusinessLogicError(details.message);
    }

    if (
      details.message.includes("network") ||
      details.message.includes("fetch")
    ) {
      return createNetworkError(details.message);
    }

    if (
      details.message.includes("unauthorized") ||
      details.message.includes("authentication")
    ) {
      return createAuthenticationError(details.message);
    }

    if (
      details.message.includes("forbidden") ||
      details.message.includes("permission")
    ) {
      return createAuthorizationError(details.message);
    }

    return createError(details.message, {
      code: details.code,
      name: details.name,
      stack: details.stack,
      context,
    });
  }

  // Handle error-like objects
  if (isErrorLike(error)) {
    return createError(error.message, {
      name: error.name,
      stack: error.stack,
      context,
    });
  }

  // Handle string errors
  if (isString(error)) {
    return createError(error, { context });
  }

  // Handle unknown errors
  return createError("An unknown error occurred", { context });
}

// ============================================================================
// ERROR HANDLING HELPERS
// ============================================================================

/**
 * Safely executes a function and returns either the result or a normalized error
 * @param fn - Function to execute
 * @param context - Additional context for error handling
 * @returns Promise that resolves to either the result or an error
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T,
  context?: Record<string, unknown>,
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: normalizeError(error, context),
    };
  }
}

/**
 * Safely executes a function synchronously and returns either the result or a normalized error
 * @param fn - Function to execute
 * @param context - Additional context for error handling
 * @returns Either the result or an error
 */
export function safeExecuteSync<T>(
  fn: () => T,
  context?: Record<string, unknown>,
): { success: true; data: T } | { success: false; error: AppError } {
  try {
    const result = fn();
    return { success: true, data: result };
  } catch (error: unknown) {
    return {
      success: false,
      error: normalizeError(error, context),
    };
  }
}

/**
 * Creates a retry mechanism with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise that resolves to either the result or an error
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: AppError) => boolean;
  } = {},
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = () => true,
  } = options;

  let lastError: AppError | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await safeExecute(fn);

    if (result.success) {
      return result;
    }

    // TypeScript type narrowing: if result.success is false, result must have error property
    lastError = (result as { success: false; error: AppError }).error;

    // Don't retry if it's the last attempt or retry condition is false
    if (attempt === maxRetries || !retryCondition(lastError)) {
      break;
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      baseDelay * Math.pow(backoffMultiplier, attempt),
      maxDelay,
    );

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return {
    success: false,
    error: lastError ?? createError("Unknown error occurred"),
  };
}

// ============================================================================
// ERROR LOGGING AND REPORTING
// ============================================================================

/**
 * Logs an error with appropriate level based on error type
 * @param error - Error to log
 * @param context - Additional context
 */
export function logError(
  error: AppError,
  context?: Record<string, unknown>,
): void {
  const logData = {
    error: {
      id: error.id,
      name: error.name,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp,
      stack: error.stack,
    },
    context: {
      ...error.context,
      ...context,
    },
  };

  // Log with better formatting for debugging
  const errorPrefix = `[${error.name}] ${error.message}`;
  const errorDetails = {
    id: error.id,
    code: error.code,
    timestamp: error.timestamp,
    stack: error.stack,
    context: logData.context,
  };

  // Use different log levels based on error type
  switch (error.name) {
    case "ValidationError":
      console.warn(errorPrefix, errorDetails);
      break;
    case "AuthenticationError":
    case "AuthorizationError":
      console.warn(errorPrefix, errorDetails);
      break;
    case "NetworkError":
      console.error(errorPrefix, errorDetails);
      break;
    case "BusinessLogicError":
      console.error(errorPrefix, errorDetails);
      break;
    default:
      console.error(errorPrefix, errorDetails);
  }
}

/**
 * Reports an error to external monitoring services
 * @param error - Error to report
 * @param context - Additional context
 */
export function reportError(
  error: AppError,
  context?: Record<string, unknown>,
): void {
  // This would integrate with your existing error reporting system
  // For now, we'll just log it
  logError(error, context);

  // In a real implementation, you might:
  // - Send to Sentry, Datadog, or other monitoring service
  // - Send to your backend error tracking endpoint
  // - Store in local error log for later analysis
}

// ============================================================================
// USER-FRIENDLY ERROR MESSAGES
// ============================================================================

/**
 * Converts technical errors into user-friendly messages
 * @param error - Error to convert
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.name) {
    case "ValidationError":
      return (error as ValidationError).field
        ? `Please check the ${(error as ValidationError).field} field and try again.`
        : "Please check your input and try again.";

    case "NetworkError": {
      const networkError = error as NetworkError;
      if (networkError.status === 404) {
        return "The requested resource was not found.";
      }
      if (networkError.status === 500) {
        return "Something went wrong on our end. Please try again later.";
      }
      if (
        networkError.status &&
        networkError.status >= 400 &&
        networkError.status < 500
      ) {
        return "There was a problem with your request. Please check your input and try again.";
      }
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    case "AuthenticationError":
      return (error as AuthenticationError).requiresReauth
        ? "Your session has expired. Please log in again."
        : "Authentication failed. Please check your credentials and try again.";

    case "AuthorizationError":
      return "You do not have permission to perform this action.";

    case "BusinessLogicError":
      return "An unexpected error occurred while processing your request.";

    default:
      return "Something went wrong. Please try again later.";
  }
}

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

/**
 * Creates an error boundary component for React
 * @param fallback - Fallback component to render on error
 * @returns Error boundary component
 */
export function createErrorBoundary(
  fallback: (error: AppError, retry: () => void) => React.ReactNode,
) {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { error: AppError | null }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { error: null };
    }

    static getDerivedStateFromError(error: unknown): { error: AppError } {
      return { error: normalizeError(error) };
    }

    componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
      const normalizedError = normalizeError(error, {
        componentStack: errorInfo.componentStack,
      });

      logError(normalizedError);
      reportError(normalizedError);
    }

    render() {
      if (this.state.error) {
        return fallback(this.state.error, () => this.setState({ error: null }));
      }

      return this.props.children;
    }
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if an error is retryable
 * @param error - Error to check
 * @returns true if the error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  switch (error.name) {
    case "NetworkError": {
      // Retry network errors unless they're client errors (4xx)
      const networkError = error as NetworkError;
      return !networkError.status || networkError.status >= 500;
    }

    case "BusinessLogicError":
      // Don't retry business logic errors
      return false;

    case "ValidationError":
      // Don't retry validation errors
      return false;

    case "AuthenticationError":
    case "AuthorizationError":
      // Don't retry auth errors
      return false;

    default:
      // Retry other errors
      return true;
  }
}

/**
 * Creates a timeout wrapper for promises
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise that rejects with timeout error if timeout is exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

/**
 * Debounces error reporting to prevent spam
 * @param errorId - Unique identifier for the error
 * @param reportFn - Function to call for reporting
 * @param debounceMs - Debounce time in milliseconds
 */
export function debounceErrorReporting(
  errorId: string,
  reportFn: () => void,
  debounceMs = 5000,
): void {
  const key = `error_report_${errorId}`;
  const lastReported = localStorage.getItem(key);
  const now = Date.now();

  if (!lastReported || now - parseInt(lastReported) > debounceMs) {
    reportFn();
    localStorage.setItem(key, now.toString());
  }
}
