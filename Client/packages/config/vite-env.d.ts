/// <reference types="vite/client" />
/// <reference types="google.maps" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ImportMetaEnv = {
  // Third-party Services
  readonly VITE_GOOGLE_MAPS_ID: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_PLAID_CLIENT_ID: string;
  readonly VITE_PUBLIC_SITE_URL: string;
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
