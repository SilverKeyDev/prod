/// <reference types="vite/client" />
/* =========================
   Type-Safe Environment Configuration
   ========================= */

import { log, LOG_CATEGORIES } from "logger";

/**
 * Extended environment interface with all used variables
 */
type ImportMetaEnv = {
  readonly VITE_GOOGLE_MAPS_ID: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_PLAID_CLIENT_ID: string;

  // Development
  readonly DEV: boolean;
  readonly PROD: boolean;
};

/**
 * Type-safe environment variable getter with validation
 */
class EnvConfig {
  private static instance: EnvConfig;
  private env: ImportMetaEnv;
  private static readonly STATIC = {
    GOOGLE_MAPS_ID: "",
    GOOGLE_CLIENT_ID: "",
    PLAID_CLIENT_ID: "",
  } as const;

  private constructor() {
    this.env = import.meta.env as unknown as ImportMetaEnv;
    this.validateRequiredEnvVars();
  }

  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  /**
   * Validate required environment variables
   */
  private validateRequiredEnvVars(): void {
    const required: Array<keyof ImportMetaEnv> = [
      "VITE_GOOGLE_MAPS_ID",
      "VITE_GOOGLE_CLIENT_ID",
      "VITE_PLAID_CLIENT_ID",
    ];

    const missing = required.filter((key) => !this.env[key]);

    if (missing.length > 0) {
      log.warn(LOG_CATEGORIES.API, "Missing required environment variables", {
        missing,
      });
    }
  }

  // Third-party Services
  get googleMapsId(): string | undefined {
    const mapId =
      EnvConfig.STATIC.GOOGLE_MAPS_ID || this.env.VITE_GOOGLE_MAPS_ID;
    if (!mapId) {
      log.warn(
        LOG_CATEGORIES.API,
        "VITE_GOOGLE_MAPS_ID not configured - using default map styling",
      );
    }
    return mapId;
  }

  get googleClientId(): string | null {
    const clientId =
      EnvConfig.STATIC.GOOGLE_CLIENT_ID || this.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      log.warn(
        LOG_CATEGORIES.API,
        "VITE_GOOGLE_CLIENT_ID not configured - Google services integration may be limited",
      );
      return null;
    }
    return clientId;
  }

  get plaidClientId(): string | null {
    const clientId =
      EnvConfig.STATIC.PLAID_CLIENT_ID || this.env.VITE_PLAID_CLIENT_ID;
    if (!clientId) {
      log.warn(
        LOG_CATEGORIES.API,
        "VITE_PLAID_CLIENT_ID not configured - Plaid integration may be limited",
      );
      return null;
    }
    return clientId;
  }

  get apiBaseUrl(): string {
    // In development: empty string uses Vite proxy (vite.config.ts)
    // In production: full URL to production backend
    if (this.isDevelopment) {
      return "";
    }
    return "https://usesilverkey.com";
  }

  get apiTimeout(): number {
    return 30000; // Default 30 second timeout
  }

  get apiRetries(): number {
    return 2; // Default 2 retries
  }

  // Environment Detection
  get isDevelopment(): boolean {
    return this.env.DEV;
  }

  get isProduction(): boolean {
    return this.env.PROD;
  }

  /**
   * Node-style environment: 'development' | 'production'.
   * Only place that reads process.env.NODE_ENV or import.meta.env.MODE.
   */
  getNodeEnv(): "development" | "production" {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      const mode = (import.meta.env as { MODE?: string }).MODE;
      return mode === "production" ? "production" : "development";
    }
    if (typeof process !== "undefined" && process.env?.NODE_ENV) {
      return process.env.NODE_ENV === "production"
        ? "production"
        : "development";
    }
    return "development";
  }

  /**
   * Get raw environment variable (use sparingly)
   */
  getRaw(key: keyof ImportMetaEnv): unknown {
    return this.env[key];
  }
}

// Export singleton instance
export const env = EnvConfig.getInstance();

/**
 * Single entry point for environment (use instead of process.env / import.meta.env).
 * Allowlist for env access: this file and build configs (vite.config.*, *.config.js).
 */
export function getEnv(): EnvConfig {
  return env;
}

// Export individual getters for convenience
export const {
  // Legacy getters filled below to keep exports stable
  isDevelopment,
  isProduction,
} = env;

// Legacy exports for backward compatibility
// Backwards-compatible implementations using the new EnvConfig
export const getBaseUrl = () => env.apiBaseUrl;
export const getDefaultTimeout = () => env.apiTimeout;
export const getDefaultRetries = () => env.apiRetries;

// Explicit exports for third-party keys
export const googleMapsId = env.googleMapsId;
export const googleClientId = env.googleClientId;
export const plaidClientId = env.plaidClientId;

/** Convenience: NODE_ENV-style string. Use getEnv().getNodeEnv() if you have getEnv() in scope. */
export const getNodeEnv = (): "development" | "production" => env.getNodeEnv();
