/* =========================
   Type-Safe Environment Configuration (shared: Metro, Vite, Node)
   Uses process.env only. Safe for React Native (Metro), Vite (via define), and Node.
   Single source of truth; Vite injects process.env at build time via define.
   ========================= */

import { log, LOG_CATEGORIES } from "packages/logger";

/**
 * Environment interface (same shape as Vite's env for API compatibility)
 */
type EnvShape = {
  readonly VITE_GOOGLE_MAPS_ID: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_PLAID_CLIENT_ID: string;
  /** Optional override for API base URL in development (Expo web / mobile dev; e.g. http://localhost:5000) */
  readonly API_BASE_URL_OVERRIDE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
};

function readProcessEnv(): EnvShape {
  const p = typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);
  const nodeEnv = p.NODE_ENV ?? "development";
  const isProd = nodeEnv === "production";
  // Support both VITE_* (web/Vite) and EXPO_PUBLIC_* (Expo/mobile) for cross-platform .env
  return {
    VITE_GOOGLE_MAPS_ID: p.VITE_GOOGLE_MAPS_ID ?? p.EXPO_PUBLIC_GOOGLE_MAPS_ID ?? "",
    VITE_GOOGLE_CLIENT_ID: p.VITE_GOOGLE_CLIENT_ID ?? p.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    VITE_PLAID_CLIENT_ID: p.VITE_PLAID_CLIENT_ID ?? p.EXPO_PUBLIC_PLAID_CLIENT_ID ?? "",
    API_BASE_URL_OVERRIDE: (
      p.EXPO_PUBLIC_API_URL ??
      p.VITE_API_URL ??
      p.EXPO_PUBLIC_API_BASE_URL ??
      p.VITE_API_BASE_URL ??
      ""
    ).trim(),
    DEV: !isProd,
    PROD: isProd,
  };
}

/**
 * Detect React Native (native) context so we can default API base URL.
 * Avoids changing web or Node behavior. Safe: no heavy imports in web bundle.
 */
function isReactNativeContext(): boolean {
  if (typeof global === "undefined") return false;
  const g = global as unknown as { __fbBatchedBridge?: unknown };
  if (g.__fbBatchedBridge !== undefined) return true;
  return false;
}

/**
 * Type-safe environment variable getter (Metro/Node; process.env only)
 */
class EnvConfig {
  private static instance: EnvConfig;
  private env: EnvShape;
  private static readonly STATIC = {
    GOOGLE_MAPS_ID: "",
    GOOGLE_CLIENT_ID: "",
    PLAID_CLIENT_ID: "",
  } as const;

  private constructor() {
    this.env = readProcessEnv();
    this.validateRequiredEnvVars();
  }

  public static getInstance(): EnvConfig {
    if (!EnvConfig.instance) {
      EnvConfig.instance = new EnvConfig();
    }
    return EnvConfig.instance;
  }

  private validateRequiredEnvVars(): void {
    const required: Array<keyof EnvShape> = [
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

  get googleMapsId(): string | undefined {
    const mapId = EnvConfig.STATIC.GOOGLE_MAPS_ID || this.env.VITE_GOOGLE_MAPS_ID;
    if (!mapId) {
      log.warn(
        LOG_CATEGORIES.API,
        "VITE_GOOGLE_MAPS_ID not configured - using default map styling"
      );
    }
    return mapId;
  }

  get googleClientId(): string | null {
    const clientId = EnvConfig.STATIC.GOOGLE_CLIENT_ID || this.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      log.warn(
        LOG_CATEGORIES.API,
        "VITE_GOOGLE_CLIENT_ID not configured - Google services integration may be limited"
      );
      return null;
    }
    return clientId;
  }

  get plaidClientId(): string | null {
    const clientId = EnvConfig.STATIC.PLAID_CLIENT_ID || this.env.VITE_PLAID_CLIENT_ID;
    if (!clientId) {
      log.warn(
        LOG_CATEGORIES.API,
        "VITE_PLAID_CLIENT_ID not configured - Plaid integration may be limited"
      );
      return null;
    }
    return clientId;
  }

  get apiBaseUrl(): string {
    if (!this.isDevelopment) {
      return "https://usesilverkey.com";
    }
    const override = this.env.API_BASE_URL_OVERRIDE;
    if (override !== "") {
      return override;
    }
    // React Native has no document origin; relative URLs fail. Default to localhost for simulator.
    if (isReactNativeContext()) {
      return "http://localhost:5000";
    }
    return "";
  }

  get apiTimeout(): number {
    return 30000;
  }

  get apiRetries(): number {
    return 2;
  }

  get isDevelopment(): boolean {
    return this.env.DEV;
  }

  get isProduction(): boolean {
    return this.env.PROD;
  }

  /**
   * Node-style environment: 'development' | 'production'.
   * Reads process.env.NODE_ENV (injected by Vite define on web, set by Metro/Expo on mobile).
   */
  getNodeEnv(): "development" | "production" {
    const p = typeof process !== "undefined" ? process.env : undefined;
    return p?.NODE_ENV === "production" ? "production" : "development";
  }

  getRaw(key: keyof EnvShape): unknown {
    return this.env[key];
  }
}

export const env = EnvConfig.getInstance();

/**
 * Single entry point for environment (use instead of process.env or Vite env).
 * Allowlist for env access: this file and build configs (vite.config.*, metro.config.js, *.config.js).
 */
export function getEnv(): EnvConfig {
  return env;
}

export const { isDevelopment, isProduction } = env;

export const getBaseUrl = () => env.apiBaseUrl;
export const getDefaultTimeout = () => env.apiTimeout;
export const getDefaultRetries = () => env.apiRetries;

export const googleMapsId = env.googleMapsId;
export const googleClientId = env.googleClientId;
export const plaidClientId = env.plaidClientId;

export const getNodeEnv = (): "development" | "production" => env.getNodeEnv();
