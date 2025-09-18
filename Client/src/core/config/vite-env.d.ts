/// <reference types="vite/client" />
/// <reference types="google.maps" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Extend Window interface for Google Maps global access
declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    google?: unknown;
  }
}

export {};
