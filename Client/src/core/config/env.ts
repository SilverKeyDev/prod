/* =========================
   Type-Safe Environment Configuration
   ========================= */

/**
 * Extended environment interface with all used variables
 */
type ImportMetaEnv = {
  // API Configuration
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_API_RETRIES: string;

  // Authentication & Security
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_BUILD_VERSION: string;

  // Third-party Services
  readonly VITE_STRIPE_PUBLIC_KEY: string;
  readonly VITE_GOOGLE_MAPS_ID: string;

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
    const required: Array<keyof ImportMetaEnv> = ['VITE_STRIPE_PUBLIC_KEY', 'VITE_GOOGLE_MAPS_ID'];

    const missing = required.filter((key) => !this.env[key]);

    if (missing.length > 0) {
      console.warn('Missing required environment variables:', missing);
    }
  }

  // API Configuration
  get apiBaseUrl(): string {
    return this.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? '';
  }

  get apiTimeout(): number {
    return this.env.VITE_API_TIMEOUT ? parseInt(this.env.VITE_API_TIMEOUT, 10) : 30000;
  }

  get apiRetries(): number {
    return this.env.VITE_API_RETRIES ? parseInt(this.env.VITE_API_RETRIES, 10) : 2;
  }

  // Security & Monitoring
  get sentryDsn(): string | undefined {
    return this.env.VITE_SENTRY_DSN;
  }

  get buildVersion(): string {
    return this.env.VITE_BUILD_VERSION || 'unknown';
  }

  // Third-party Services
  get stripePublicKey(): string | null {
    const key = this.env.VITE_STRIPE_PUBLIC_KEY;
    if (!key) {
      console.warn('VITE_STRIPE_PUBLIC_KEY not configured - Stripe payments disabled');
      return null;
    }
    return key;
  }

  get googleMapsId(): string | undefined {
    const mapId = this.env.VITE_GOOGLE_MAPS_ID;
    if (!mapId) {
      console.warn('VITE_GOOGLE_MAPS_ID not configured - using default map styling');
    }
    return mapId;
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
  apiBaseUrl,
  apiTimeout,
  apiRetries,
  sentryDsn,
  buildVersion,
  stripePublicKey,
  googleMapsId,
  isDevelopment,
  isProduction,
} = env;

// Legacy exports for backward compatibility
export const getBaseUrl = () => env.apiBaseUrl;
export const getDefaultTimeout = () => env.apiTimeout;
export const getDefaultRetries = () => env.apiRetries;
