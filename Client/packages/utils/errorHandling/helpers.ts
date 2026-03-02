/**
 * Safe execution and retry helpers.
 */

import { createError } from "./factories";
import { normalizeError } from "./normalize";
import type { AppError } from "./types";

/**
 * Safely executes a function and returns either the result or a normalized error
 */
export async function safeExecute<T>(
  fn: () => Promise<T> | T,
  context?: Record<string, unknown>
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
 * Safely executes a function synchronously and returns either the result or an error
 */
export function safeExecuteSync<T>(
  fn: () => T,
  context?: Record<string, unknown>
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
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: AppError) => boolean;
  } = {}
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

    lastError = (result as { success: false; error: AppError }).error;

    if (attempt === maxRetries || !retryCondition(lastError)) {
      break;
    }

    const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return {
    success: false,
    error: lastError ?? createError("Unknown error occurred"),
  };
}
