/**
 * Error normalization - converts any error into a standardized AppError format
 */

import {
  extractErrorDetails,
  isApiError,
  isError,
  isErrorLike,
  isObject,
  isString,
} from "packages/utils/typeGuards";

import {
  createAuthenticationError,
  createAuthorizationError,
  createBusinessLogicError,
  createError,
  createNetworkError,
  createValidationError,
} from "./factories";
import type { AppError } from "./types";

/**
 * Normalizes any error into a standardized format
 */
export function normalizeError(error: unknown, context?: Record<string, unknown>): AppError {
  if (isObject(error) && "id" in error && "timestamp" in error) {
    return error as AppError;
  }

  if (isApiError(error)) {
    return createNetworkError(
      error.message || error.error,
      undefined,
      undefined,
      context?.url as string
    );
  }

  if (isError(error)) {
    const details = extractErrorDetails(error);

    if (error.name === "ValidationError" || details.message.includes("validation")) {
      return createValidationError(details.message, undefined, undefined);
    }

    if (error.name === "TypeError" || error.name === "ReferenceError") {
      return createBusinessLogicError(details.message);
    }

    if (details.message.includes("network") || details.message.includes("fetch")) {
      return createNetworkError(details.message);
    }

    if (details.message.includes("unauthorized") || details.message.includes("authentication")) {
      return createAuthenticationError(details.message);
    }

    if (details.message.includes("forbidden") || details.message.includes("permission")) {
      return createAuthorizationError(details.message);
    }

    return createError(details.message, {
      code: details.code,
      name: details.name,
      stack: details.stack,
      context,
    });
  }

  if (isErrorLike(error)) {
    return createError(error.message, {
      name: error.name,
      stack: error.stack,
      context,
    });
  }

  if (isString(error)) {
    return createError(error, { context });
  }

  return createError("An unknown error occurred", { context });
}
