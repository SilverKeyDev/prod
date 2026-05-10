/// <reference types="vite/client" />
/// <reference types="google.maps" />

/**
 * Vite client types. App env is read via process.env in packages/config/env.ts;
 * Vite injects values at build time via define in vite.config.ts (no import.meta in shared packages).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ImportMetaEnv = {
  // Third-party Services
  readonly VITE_GOOGLE_MAPS_ID: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_PLAID_CLIENT_ID: string;
  /** Public web origin, no trailing slash (e.g. https://app.example.com). Used for SEO canonicals and sitemap. */
  readonly VITE_PUBLIC_SITE_URL: string;
  /** Google Search Console HTML tag verification content token (optional). */
  readonly VITE_GOOGLE_SITE_VERIFICATION: string;
  /** When `"true"`, registers the `/admin` route in the web app. */
  readonly VITE_ENABLE_ADMIN_PANEL?: string;

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
