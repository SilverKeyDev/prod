/**
 * Services barrel file - centralized exports for all services
 * Organized by category for better discoverability
 */

// Authentication Services - Centralized Auth Service
export {
  AUTH_CONFIG,
  AuthEvents,
  AuthStatus,
  authUtils,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  UserRole,
} from "packages/config/auth/auth";

// Legacy auth utilities (deprecated - use AuthService instead)
export { clearAuthTokens, getAuthToken, hasValidAuthToken } from "packages/utils";

// HTTP Services
export { configureHttpClient, getHttpClientConfig, httpClient } from "./http/config";
export { getBaseUrl } from "packages/config";

// Security Services
export { errorReporter } from "./security/errorReporting";
export {
  createErrorContext,
  createErrorReport,
  extractErrorMessage,
  isAuthError,
  isNetworkError,
  serializeError,
} from "./security/errorUtils";
export { imageProcessor } from "./security/imageProcessor";
export {
  containsSensitiveData,
  createSafeLogObject,
  isSensitiveKey,
  maskSensitiveData,
  PII_PATTERNS,
  redactErrorMessage,
  scrubObjectPII,
  scrubPII,
  SENSITIVE_KEYS,
} from "./security/piiSecurity";
export { secureLogger } from "./security/secureLogger";

// Type exports for consumers
export type { ErrorContext, SerializedError } from "./security/errorUtils";
