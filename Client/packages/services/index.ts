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
} from "packages/config/auth";

// Legacy auth utilities (deprecated - use AuthService instead)
export {
  clearAuthTokens,
  getAuthToken,
  hasValidAuthToken,
} from "packages/utils";

// HTTP Services
export {
  configureHttpClient,
  getHttpClientConfig,
  httpClient,
} from "./http/config";
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
export { GoogleMapsService, googleMapsService } from "./search/googleMaps";

// Negotiation Services
export { NegotiationService, negotiationService } from "./negotiation";

// Reports Services
export { ReportsService, reportsService } from "./reports";

// SavedHomes Services
export { SavedHomesService, savedHomesService } from "./search/savedHomes";

// Agent Services
export { AgentService, agentService } from "./agent/agent";

// Document Services
export { DocumentService, documentService } from "./documents";

// Type exports for consumers
export type {
  NegotiationServiceCallbacks,
  NegotiationState,
} from "./negotiation";
export type { ErrorContext, SerializedError } from "./security/errorUtils";
// Note: Reports and SavedHomes no longer export state/callback types; state is managed elsewhere
