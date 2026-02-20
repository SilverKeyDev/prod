/**
 * Error types and interfaces for centralized error handling
 */

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
