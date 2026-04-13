/**
 * Navigation item type
 */
export type NavItem = {
  key: string;
  to: string;
  label: string;
  icon?: unknown;
  disabled?: boolean;
};

// Route path constants
export const ROUTES = {
  // Public routes
  HOME: "/",
  SIGNUP: "/signup",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
  ONBOARDING: "/onboarding",
  VERIFICATION: "/verification",
  PRIVACY: "/privacy",
  TERMS: "/terms",
  CONTACT: "/contact",

  // Protected routes
  PROFILE: "/profile/*",
  SAVED: "/saved/*",
  DASHBOARD: "/dashboard/*",
  /** DocuSign embedded signing return URL (see Server DOCUSIGN_SIGNING_COMPLETE_PATH). */
  AGREEMENT_SIGNING_COMPLETE: "/agreements/:agreementId/complete",
  MESSAGING: "/messaging",
  SEARCH: "/search",
  PROPERTY_DETAILS: "/property-details",
  PROPERTY: "/property/:zpid/:slug?",

  // Legacy redirects
  APP: "/app/*",
} as const;
