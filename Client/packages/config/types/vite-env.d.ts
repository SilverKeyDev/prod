/// <reference types="vite/client" />
/// <reference types="google.maps" />

/**
 * Vite client types. App env is read via process.env in packages/config/env.ts;
 * Vite injects values at build time via process shim in vite.config.js (no import.meta in shared packages).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ImportMetaEnv = {
  readonly EXPO_PUBLIC_GOOGLE_MAPS_ID: string;
  readonly EXPO_PUBLIC_GOOGLE_CLIENT_ID: string;
  readonly EXPO_PUBLIC_PLAID_CLIENT_ID: string;
  /** Optional: canonical public origin for production SEO (sitemap / robots); web Vite build only. */
  readonly EXPO_PUBLIC_SITE_URL?: string;
  /** Optional: Google Search Console verification token; web Vite build only. */
  readonly EXPO_PUBLIC_GOOGLE_SITE_VERIFICATION?: string;

  // Development
  readonly DEV: boolean;
  readonly PROD: boolean;
};

// Extend Window interface for Google Maps global access
declare global {
  interface Window {
    google?: unknown;
  }
}

export {};
