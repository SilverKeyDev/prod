/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_BASE_URL?: string;

  // Third-party Services
  readonly VITE_STRIPE_PUBLIC_KEY?: string;
  readonly VITE_GOOGLE_MAPS_ID?: string;
  readonly VITE_SENTRY_DSN?: string;

  // Build Information
  readonly VITE_BUILD_VERSION?: string;

  // Built-in Vite variables (explicitly typed for clarity)
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
