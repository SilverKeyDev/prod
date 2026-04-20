/**
 * Centralized Error Handling Utilities
 * Builds upon existing error handling patterns and provides consistent error management.
 *
 * NOTE: This module is framework-agnostic. For React-specific error boundaries,
 * see the ErrorBoundary component in apps/web/app/error/ErrorBoundary.tsx
 */

export { asError } from "./error";
export { type ErrorBoundaryInfo, reportErrorBoundary } from "./errorBoundaryReport";
export {
  createAuthenticationError,
  createAuthorizationError,
  createBusinessLogicError,
  createError,
  createNetworkError,
  createValidationError,
} from "./factories";
export { safeExecute, safeExecuteSync, withRetry } from "./helpers";
export { logError, reportError } from "./logging";
export { normalizeError } from "./normalize";
export type {
  AppError,
  AuthenticationError,
  AuthorizationError,
  BusinessLogicError,
  NetworkError,
  StandardError,
  ValidationError,
} from "./types";
export { debounceErrorReporting, isRetryableError, withTimeout } from "./userFacingErrors";
export { getUserFriendlyMessage } from "./userMessages";
