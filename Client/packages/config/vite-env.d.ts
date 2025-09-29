/// <reference types="vite/client" />
/// <reference types="google.maps" />

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ImportMetaEnv = {
  // Third-party Services
  readonly VITE_GOOGLE_MAPS_ID: string;
  readonly VITE_PLAID_CLIENT_ID: string;

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
