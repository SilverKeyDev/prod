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

// Report Services

// Google Maps Services
export { GoogleMapsService, googleMapsService } from "packages/features/search/utils/googleMaps";

// Negotiation Services
export { NegotiationService, negotiationService } from "packages/features/negotiate/utils";

// SavedHomes Services
export { SavedHomesService, savedHomesService } from "packages/features/search/api/savedHomes";

// Agent Services
export { AgentService, agentService } from "./agent/agentService";

// Document Services
export { DocumentService, documentService } from "packages/features/documents/api/documentService";

// Type exports for consumers
export type { ErrorContext, SerializedError } from "./security/errorUtils";
export type {
  NegotiationServiceCallbacks,
  NegotiationState,
} from "packages/features/negotiate/utils";
// Note: Reports and SavedHomes no longer export state/callback types; state is managed elsewhere
