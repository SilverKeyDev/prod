/* =========================
   Core Configuration Exports
   ========================= */

// Environment configuration
export * from "./env";

// Authentication configuration (moved to services/auth)
// export * from './auth'; // Removed - auth config now in services/auth

// HTTP configuration
export * from "./http";

// API configuration (existing)
export * from "./api";

// Platform configuration (platform variants, primitives, and related types)
export * from "./platform";

// Abort and auth-error utilities (re-exported so features need not import from services/http)
export { createAbortManager, isAbortError } from "./abort";
export type { AuthenticationError } from "./authErrors";
export { handleAuthenticationError, isAuthenticationError } from "./authErrors";

// Re-export commonly used items for convenience
export { env, getBaseUrl, getDefaultRetries, getDefaultTimeout, getEnv, getNodeEnv } from "./env";
export { HTTP_CONFIG, HttpConfigFactory, httpUtils } from "./http";
