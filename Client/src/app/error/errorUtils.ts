/**
 * Error Utilities
 * Tiny helper functions for error handling and normalization
 */

interface NormalizedError {
  message: string;
  stack?: string;
  name?: string;
}

/**
 * Reports an error to console and external services
 * @param error - The error to report
 * @param context - Additional context about the error
 */
export function reportError(error: unknown, context?: Record<string, any>): void {
  const normalizedError = normalizeError(error);
  
  // Console logging for development
  console.error('Error reported:', {
    error: normalizedError,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  });

  // In production, this would integrate with error reporting services
  // like Sentry, LogRocket, or custom error tracking
  if (import.meta.env.PROD) {
    // Example: Sentry.captureException(error, { extra: context });
    // Example: LogRocket.captureException(error);
  }
}

/**
 * Normalizes different error types into a consistent format
 * @param error - The error to normalize
 * @returns Normalized error object
 */
export function normalizeError(error: unknown): NormalizedError {
  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      name: 'StringError',
    };
  }

  // Handle objects with message property
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String((error as any).message),
      stack: 'stack' in error ? String((error as any).stack) : undefined,
      name: 'name' in error ? String((error as any).name) : 'ObjectError',
    };
  }

  // Handle null/undefined
  if (error == null) {
    return {
      message: 'Unknown error occurred',
      name: 'NullError',
    };
  }

  // Handle other types
  try {
    return {
      message: JSON.stringify(error),
      name: 'SerializedError',
    };
  } catch {
    return {
      message: String(error),
      name: 'UnknownError',
    };
  }
}

/**
 * Creates a user-friendly error message from any error type
 * @param error - The error to format
 * @returns User-friendly error message
 */
export function formatErrorMessage(error: unknown): string {
  const normalized = normalizeError(error);
  
  // Common error message mappings
  const errorMappings: Record<string, string> = {
    'Network Error': 'Unable to connect to the server. Please check your internet connection.',
    'TypeError': 'A technical error occurred. Please try again.',
    'ReferenceError': 'A technical error occurred. Please try again.',
    'SyntaxError': 'A technical error occurred. Please try again.',
    'ChunkLoadError': 'Failed to load application resources. Please refresh the page.',
  };

  // Check for mapped error messages
  for (const [errorType, userMessage] of Object.entries(errorMappings)) {
    if (normalized.message.includes(errorType) || normalized.name === errorType) {
      return userMessage;
    }
  }

  // Return original message if it's user-friendly, otherwise generic message
  if (normalized.message.length < 100 && !normalized.message.includes('at ')) {
    return normalized.message;
  }

  return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
}

/**
 * Checks if an error is a network-related error
 * @param error - The error to check
 * @returns True if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  const normalized = normalizeError(error);
  const networkIndicators = [
    'Network Error',
    'fetch',
    'NETWORK_ERROR',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'Failed to fetch',
  ];

  return networkIndicators.some(indicator => 
    normalized.message.includes(indicator) || 
    normalized.name?.includes(indicator)
  );
}

/**
 * Checks if an error is an authentication-related error
 * @param error - The error to check
 * @returns True if the error is authentication-related
 */
export function isAuthError(error: unknown): boolean {
  const normalized = normalizeError(error);
  const authIndicators = [
    'Unauthorized',
    'Authentication',
    'AUTH_ERROR',
    '401',
    'Invalid token',
    'Token expired',
  ];

  return authIndicators.some(indicator => 
    normalized.message.includes(indicator) || 
    normalized.name?.includes(indicator)
  );
}
