/**
 * Error utility functions - user-friendly messages, retryability, timeout, debounce
 */

import { getLocalStorage } from "packages/utils/storage/platformStorage";

import type {
  AppError,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from "./types";

/**
 * Converts technical errors into user-friendly messages
 */
export function getUserFriendlyMessage(error: AppError): string {
  switch (error.name) {
    case "ValidationError":
      return (error as ValidationError).field
        ? `Please check the ${
            (error as ValidationError).field
          } field and try again.`
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

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  switch (error.name) {
    case "NetworkError": {
      const networkError = error as NetworkError;
      return !networkError.status || networkError.status >= 500;
    }

    case "BusinessLogicError":
    case "ValidationError":
    case "AuthenticationError":
    case "AuthorizationError":
      return false;

    default:
      return true;
  }
}

/**
 * Creates a timeout wrapper for promises
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
 */
export function debounceErrorReporting(
  errorId: string,
  reportFn: () => void,
  debounceMs = 5000,
): void {
  const key = `error_report_${errorId}`;
  const storage = getLocalStorage();
  const lastReported = storage.getItem(key);
  const now = Date.now();

  if (!lastReported || now - parseInt(lastReported) > debounceMs) {
    reportFn();
    storage.setItem(key, now.toString());
  }
}
