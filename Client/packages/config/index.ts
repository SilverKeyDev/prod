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

// Re-export commonly used items for convenience
export { env, getBaseUrl, getDefaultTimeout, getDefaultRetries } from "./env";
export { HTTP_CONFIG, HttpConfigFactory, httpUtils } from "./http";
