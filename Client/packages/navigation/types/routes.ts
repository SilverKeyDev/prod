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
  LIBRARY: "/library/*",
  DASHBOARD: "/dashboard/*",
  /** DocuSign embedded signing return URL (see Server DOCUSIGN_SIGNING_COMPLETE_PATH). */
  AGREEMENT_SIGNING_COMPLETE: "/agreements/:agreementId/complete",
  MESSAGING: "/messaging",
  ANALYTICS: "/analytics",
  /** Client: discover / connect with agents (recommendations + search). */
  FIND_AGENTS: "/find-agents",
  SEARCH: "/search",
  PROPERTY_DETAILS: "/property-details",
  PROPERTY: "/property/:zpid/:slug?",
  AGENT_PROFILE: "/agent-profile/:name/:briefSlug",
  /** Short public agent profile (`/a/{public_profile_slug}`). */
  AGENT_PROFILE_SHORT: "/a/:publicSlug",

  // Legacy redirects
  APP: "/app/*",
} as const;
