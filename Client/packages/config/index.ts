/* =========================
   Core Configuration Exports
   ========================= */

// Environment configuration
export * from "./env";

// Authentication configuration (moved to services/auth)
// export * from './auth'; // Removed - auth config now in services/auth

// HTTP configuration
export * from "./http/http";

// API configuration (existing)
export * from "./http/api";

// Platform configuration (platform variants, primitives, and related types)
export * from "./platform";

// Provider composition order (web and native)
export * from "./providerOrder";

// Abort and auth-error utilities (re-exported so features need not import from services/http)
export type { AuthenticationError } from "./auth/authErrors";
export { handleAuthenticationError, isAuthenticationError } from "./auth/authErrors";
export { createAbortManager, isAbortError } from "./http/abort";

// Re-export commonly used items for convenience
export { env, getBaseUrl, getDefaultRetries, getDefaultTimeout, getEnv, getNodeEnv } from "./env";
export { HTTP_CONFIG, HttpConfigFactory, httpUtils } from "./http/http";
