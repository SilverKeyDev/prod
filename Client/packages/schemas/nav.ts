import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Navigation item type
 * Supports both React.ReactNode (for flexible icon rendering) and LucideIcon (for type-safe icon components)
 */
export type NavItem = {
  key: string;
  to: string;
  label: string;
  icon?: ReactNode | LucideIcon;
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
