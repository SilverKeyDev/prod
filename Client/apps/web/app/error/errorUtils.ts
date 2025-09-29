import {
  normalizeError as normalizeErrorCore,
  getUserFriendlyMessage,
  logError,
  reportError as reportErrorCore,
  type AppError,
} from "../../../../packages/utils/errorHandling";

/**
 * Error Utilities
 * Enhanced error handling using centralized utilities
 * @deprecated Use core/utils/errorHandling.ts instead for new code
 */

type NormalizedError = AppError;

/**
 * Reports an error to console and external services
 * @param error - The error to report
 * @param context - Additional context about the error
 * @deprecated Use reportError from core/utils/errorHandling.ts instead
 */
export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  // Use the new centralized error handling
  const normalizedError = normalizeErrorCore(error, context);
  logError(normalizedError, context);
  reportErrorCore(normalizedError, context);
}

/**
 * Normalizes different error types into a consistent format
 * @param error - The error to normalize
 * @returns Normalized error object
 */
export function normalizeError(error: unknown): NormalizedError {
  return normalizeErrorCore(error);
}

/**
 * Creates a user-friendly error message from any error type
 * @param error - The error to format
 * @returns User-friendly error message
 * @deprecated Use getUserFriendlyMessage from core/utils/errorHandling.ts instead
 */
export function formatErrorMessage(error: unknown): string {
  const normalized = normalizeErrorCore(error);
  return getUserFriendlyMessage(normalized);
}

/**
 * Checks if an error is a network-related error
 * @param error - The error to check
 * @returns True if the error is network-related
 * @deprecated Use isNetworkError from core/utils/errorHandling.ts instead
 */
export function isNetworkError(error: unknown): boolean {
  const normalized = normalizeErrorCore(error);
  return normalized.name === "NetworkError";
}

/**
 * Checks if an error is an authentication-related error
 * @param error - The error to check
 * @returns True if the error is authentication-related
 * @deprecated Use isAuthenticationError from core/utils/errorHandling.ts instead
 */
export function isAuthError(error: unknown): boolean {
  const normalized = normalizeErrorCore(error);
  return normalized.name === "AuthenticationError";
}
