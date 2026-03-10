/**
 * Deep link path -> screen name mappings for native (Linking / React Navigation).
 * Shared so useDeepLink.native and any URL handling stay in sync with ROUTE_TO_SCREEN.
 * No platform APIs; only constants.
 */

/** Auth flow pathname -> React Navigation screen name. */
export const AUTH_SCREENS: Record<string, string> = {
  "/": "Home",
  "/login": "Login",
  "/signup": "Signup",
  "/forgot-password": "ForgotPassword",
  "/onboarding": "Onboarding",
  "/verification": "Verification",
  "/privacy": "Privacy",
  "/terms": "Terms",
  "/contact": "Contact",
};

/** App tab pathname -> React Navigation tab screen name. */
export const APP_TAB_DEEP_LINK: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/search": "Search",
  "/saved": "Saved",
  "/messaging": "Messaging",
  "/profile": "Profile",
};
