/* =========================
   Type-Safe Environment Configuration (shared: Metro, Vite, Node)
   Uses process.env only. Safe for React Native (Metro), Vite (via inject shim), and Node.
   Client-visible keys use EXPO_PUBLIC_* (Metro + Vite web shim); application code does not use Vite-prefixed env keys.
   ========================= */

import { log } from "packages/logger";
import { resolveGoogleMapsCloudMapId } from "packages/utils/product/maps/cloudMapId/resolveGoogleMapsCloudMapId";

function trimEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

/**
 * Shape mirrored into `process.env` by the web Vite process shim (see apps/web/vite.config.js).
 * On native, Metro inlines EXPO_PUBLIC_* from .env.
 */
type EnvShape = {
  readonly EXPO_PUBLIC_GOOGLE_MAPS_ID: string;
  readonly EXPO_PUBLIC_GOOGLE_CLIENT_ID: string;
  readonly EXPO_PUBLIC_PLAID_CLIENT_ID: string;
  readonly EXPO_PUBLIC_API_URL: string;
  readonly EXPO_PUBLIC_API_BASE_URL: string;
  readonly EXPO_PUBLIC_POSTHOG_KEY: string;
  readonly EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: string;
  readonly EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
};

function readProcessEnv(): EnvShape {
  const p = typeof process !== "undefined" ? process.env : ({} as NodeJS.ProcessEnv);
  const nodeEnv = p.NODE_ENV ?? "development";
  const isProd = nodeEnv === "production";
  return {
    EXPO_PUBLIC_GOOGLE_MAPS_ID: trimEnv(p.EXPO_PUBLIC_GOOGLE_MAPS_ID),
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: trimEnv(p.EXPO_PUBLIC_GOOGLE_CLIENT_ID),
    EXPO_PUBLIC_PLAID_CLIENT_ID: trimEnv(p.EXPO_PUBLIC_PLAID_CLIENT_ID),
    EXPO_PUBLIC_API_URL: trimEnv(p.EXPO_PUBLIC_API_URL),
    EXPO_PUBLIC_API_BASE_URL: trimEnv(p.EXPO_PUBLIC_API_BASE_URL),
    EXPO_PUBLIC_POSTHOG_KEY: trimEnv(p.EXPO_PUBLIC_POSTHOG_KEY),
    EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS: trimEnv(p.EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS),
    EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR: trimEnv(p.EXPO_PUBLIC_USE_GOOGLE_MAPS_IOS_SIMULATOR),
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
      "EXPO_PUBLIC_GOOGLE_MAPS_ID",
      "EXPO_PUBLIC_GOOGLE_CLIENT_ID",
      "EXPO_PUBLIC_PLAID_CLIENT_ID",
    ];

    const missing = required.filter((key) => !this.env[key]);

    if (missing.length > 0) {
      log.warn("API", "Missing required environment variables", {
        missing,
      });
    }
  }

  get googleMapsId(): string | undefined {
    const mapId =
      EnvConfig.STATIC.GOOGLE_MAPS_ID ||
      resolveGoogleMapsCloudMapId(this.env.EXPO_PUBLIC_GOOGLE_MAPS_ID) ||
      resolveGoogleMapsCloudMapId(this.env.EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS);
    if (!mapId) {
      log.warn(
        "API",
        "Google Maps Cloud map ID not configured (EXPO_PUBLIC_GOOGLE_MAPS_ID or EXPO_PUBLIC_GOOGLE_MAPS_ID_IOS) - using default map styling"
      );
    }
    return mapId;
  }

  get googleClientId(): string | null {
    const clientId = EnvConfig.STATIC.GOOGLE_CLIENT_ID || this.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      log.warn(
        "API",
        "EXPO_PUBLIC_GOOGLE_CLIENT_ID not configured - Google services integration may be limited"
      );
      return null;
    }
    return clientId;
  }

  get plaidClientId(): string | null {
    const clientId = EnvConfig.STATIC.PLAID_CLIENT_ID || this.env.EXPO_PUBLIC_PLAID_CLIENT_ID;
    if (!clientId) {
      log.warn(
        "API",
        "EXPO_PUBLIC_PLAID_CLIENT_ID not configured - Plaid integration may be limited"
      );
      return null;
    }
    return clientId;
  }

  get apiBaseUrl(): string {
    if (!this.isDevelopment) {
      return "https://usesilverkey.com";
    }
    const override = trimEnv(this.env.EXPO_PUBLIC_API_URL || this.env.EXPO_PUBLIC_API_BASE_URL);
    if (override !== "") {
      return override;
    }
    // React Native: no document origin; relative URLs fail. Default localhost often fails on
    // simulator/device because localhost is the device, not the host. Set EXPO_PUBLIC_API_URL
    // to your machine's IP (e.g. http://192.168.1.5:5000) when the backend runs on the host.
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

  get posthogKey(): string | null {
    const key = trimEnv(this.env.EXPO_PUBLIC_POSTHOG_KEY);
    return key || null;
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
 * Single entry point for environment (use instead of process.env or import.meta.env in shared code).
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
