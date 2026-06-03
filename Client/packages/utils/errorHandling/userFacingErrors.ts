/**
 * Error utility functions - retryability, timeout, debounce
 */

import { getLocalStorage } from "packages/utils/storage/platformStorage";

import type { AppError, NetworkError } from "./types";

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
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
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
  debounceMs = 5000
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
