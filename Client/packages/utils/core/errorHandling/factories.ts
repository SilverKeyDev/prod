/**
 * Error factory functions for creating standardized error objects
 */

import { dateNow } from "packages/utils/core/date";

import type {
  AuthenticationError,
  AuthorizationError,
  BusinessLogicError,
  NetworkError,
  StandardError,
  ValidationError,
} from "./types";

/**
 * Creates a standardized error object
 */
export function createError(
  message: string,
  options: {
    code?: string | number;
    name?: string;
    context?: Record<string, unknown>;
    stack?: string;
  } = {}
): StandardError {
  return {
    message,
    code: options.code,
    name: options.name || "StandardError",
    stack: options.stack,
    context: options.context,
    timestamp: dateNow().toISOString(),
    id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
  };
}

export function createValidationError(
  message: string,
  field?: string,
  fieldErrors?: Record<string, string>
): ValidationError {
  return {
    ...createError(message, { name: "ValidationError" }),
    name: "ValidationError" as const,
    field,
    fieldErrors,
  };
}

export function createNetworkError(
  message: string,
  status?: number,
  statusText?: string,
  url?: string
): NetworkError {
  return {
    ...createError(message, { name: "NetworkError" }),
    name: "NetworkError" as const,
    status,
    statusText,
    url,
  };
}

export function createAuthenticationError(
  message: string,
  requiresReauth = false
): AuthenticationError {
  return {
    ...createError(message, { name: "AuthenticationError" }),
    name: "AuthenticationError" as const,
    requiresReauth,
  };
}

export function createAuthorizationError(
  message: string,
  requiredPermission?: string
): AuthorizationError {
  return {
    ...createError(message, { name: "AuthorizationError" }),
    name: "AuthorizationError" as const,
    requiredPermission,
  };
}

export function createBusinessLogicError(message: string, operation?: string): BusinessLogicError {
  return {
    ...createError(message, { name: "BusinessLogicError" }),
    name: "BusinessLogicError" as const,
    operation,
  };
}
