/**
 * Services barrel file - centralized exports for all services
 * Organized by category for better discoverability
 */

// Authentication Services - Centralized Auth Service
export {
  AUTH_CONFIG,
  authUtils,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  UserRole,
  AuthStatus,
  AuthEvents,
} from "../config/auth";

// Legacy auth utilities (deprecated - use AuthService instead)
export {
  getAuthToken,
  clearAuthTokens,
  hasValidAuthToken,
} from "../utils/auth";

// HTTP Services
export {
  httpClient,
  configureHttpClient,
  getHttpClientConfig,
} from "./http/config";
export { getBaseUrl } from "../config";

// Security Services
export {
  PII_PATTERNS,
  SENSITIVE_KEYS,
  containsSensitiveData,
  maskSensitiveData,
  scrubPII,
  scrubObjectPII,
  isSensitiveKey,
  redactErrorMessage,
  createSafeLogObject,
} from "./security/piiSecurity";

export {
  createErrorContext,
  serializeError,
  createErrorReport,
  extractErrorMessage,
  isNetworkError,
  isAuthError,
} from "./security/errorUtils";

export { imageProcessor } from "./security/imageProcessor";
export { secureLogger } from "./security/secureLogger";
export { errorReporter } from "./security/errorReporting";

// Report Services

// Google Maps Services
export { GoogleMapsService, googleMapsService } from "./googleMaps";

// Negotiation Services
export { NegotiationService, negotiationService } from "./negotiation";

// Reports Services
export { ReportsService, reportsService } from "./reports";

// SavedHomes Services
export { SavedHomesService, savedHomesService } from "./savedHomes";

// Type exports for consumers
export type { ErrorContext, SerializedError } from "./security/errorUtils";
export type {
  NegotiationState,
  NegotiationServiceCallbacks,
} from "./negotiation";
// Note: Reports and SavedHomes no longer export state/callback types; state is managed elsewhere
