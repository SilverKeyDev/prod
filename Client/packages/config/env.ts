/* =========================
   Type-Safe Environment Configuration
   ========================= */

/**
 * Extended environment interface with all used variables
 */
type ImportMetaEnv = {
  readonly VITE_GOOGLE_MAPS_ID: string;
  readonly VITE_PLAID_CLIENT_ID: string;
  readonly VITE_API_BASE_URL: string;

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
    PLAID_CLIENT_ID: "",
    API_BASE_URL: "",
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
      "VITE_PLAID_CLIENT_ID",
    ];

    const missing = required.filter((key) => !this.env[key]);

    if (missing.length > 0) {
      console.warn("Missing required environment variables:", missing);
    }
  }

  // Third-party Services
  get googleMapsId(): string | undefined {
    const mapId =
      EnvConfig.STATIC.GOOGLE_MAPS_ID || this.env.VITE_GOOGLE_MAPS_ID;
    if (!mapId) {
      console.warn(
        "VITE_GOOGLE_MAPS_ID not configured - using default map styling",
      );
    }
    return mapId;
  }

  get plaidClientId(): string | null {
    const clientId =
      EnvConfig.STATIC.PLAID_CLIENT_ID || this.env.VITE_PLAID_CLIENT_ID;
    if (!clientId) {
      console.warn(
        "VITE_PLAID_CLIENT_ID not configured - Plaid integration may be limited",
      );
      return null;
    }
    return clientId;
  }

  get apiBaseUrl(): string {
    return EnvConfig.STATIC.API_BASE_URL || this.env.VITE_API_BASE_URL || "";
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
   * Get raw environment variable (use sparingly)
   */
  getRaw(key: keyof ImportMetaEnv): unknown {
    return this.env[key];
  }
}

// Export singleton instance
export const env = EnvConfig.getInstance();

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
export const plaidClientId = env.plaidClientId;
