/**
 * Error logging (framework-agnostic).
 * For log + send-to-backend, use reportErrorWithCapture from packages/services/security/errorReporting.
 */

import { log, LOG_CATEGORIES } from "packages/logger";

import { normalizeError } from "./normalize";
import type { AppError } from "./types";

/**
 * Logs an error with appropriate level based on error type
 */
export function logError(
  error: AppError,
  context?: Record<string, unknown>,
): void {
  const errorPrefix = `[${error.name}] ${error.message}`;
  const errorDetails = {
    id: error.id,
    code: error.code,
    timestamp: error.timestamp,
    stack: error.stack,
    context: { ...error.context, ...context },
  };

  switch (error.name) {
    case "ValidationError":
      log.warn(LOG_CATEGORIES.ERRORS, errorPrefix, errorDetails);
      break;
    case "AuthenticationError":
    case "AuthorizationError":
      log.warn(LOG_CATEGORIES.AUTH, errorPrefix, errorDetails);
      break;
    case "NetworkError":
      log.error(LOG_CATEGORIES.HTTP, errorPrefix, errorDetails);
      break;
    case "BusinessLogicError":
      log.error(LOG_CATEGORIES.ERRORS, errorPrefix, errorDetails);
      break;
    default:
      log.error(LOG_CATEGORIES.ERRORS, errorPrefix, errorDetails);
  }
}

/**
 * Logs an error locally (normalizes if needed). Does not send to backend.
 * For log + send to backend, use reportErrorWithCapture from packages/services/security/errorReporting.
 */
export function reportError(
  error: AppError | unknown,
  context?: Record<string, unknown>,
): void {
  const normalized =
    typeof error === "object" &&
    error !== null &&
    "id" in error &&
    "timestamp" in error
      ? (error as AppError)
      : normalizeError(error, context);
  logError(normalized, context);
}
