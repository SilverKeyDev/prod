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
  MESSAGING: "/messaging",
  SEARCH: "/search",

  // Legacy redirects
  APP: "/app/*",
} as const;
