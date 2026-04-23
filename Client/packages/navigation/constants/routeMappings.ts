/**
 * Route-to-screen name mapping for React Navigation (native).
 * Shared constant so useNavigation.native and deep link logic stay in sync.
 * No platform APIs; only constants and pure helpers.
 */

import { pathFor } from "packages/navigation/router/paths";
import type { ParamsForRoute, RouteName } from "packages/navigation/types";

/** Map shared route name to React Navigation screen name (tabs + auth). */
export const ROUTE_TO_SCREEN: Record<RouteName, string> = {
  HOME: "Home",
  SIGNUP: "Signup",
  LOGIN: "Login",
  FORGOT_PASSWORD: "ForgotPassword",
  ONBOARDING: "Onboarding",
  VERIFICATION: "Verification",
  PRIVACY: "Privacy",
  TERMS: "Terms",
  CONTACT: "Contact",
  PROFILE: "Profile",
  SAVED: "Saved",
  DASHBOARD: "Dashboard",
  AGREEMENT_SIGNING_COMPLETE: "Dashboard",
  MESSAGING: "Messaging",
  FIND_AGENTS: "FindAgents",
  SEARCH: "Search",
  PROPERTY_DETAILS: "PropertyDetails",
  PROPERTY: "PropertyDetails",
  AGENT_PROFILE: "AgentProfile",
  APP: "Dashboard",
};

/**
 * Build pathname from React Navigation screen name and params (inverse of pathFor).
 */
export function pathnameFromScreen(screenName: string, params?: Record<string, unknown>): string {
  const routeName = (Object.entries(ROUTE_TO_SCREEN).find(([, s]) => s === screenName)?.[0] ??
    "HOME") as RouteName;
  return pathFor(routeName, params as ParamsForRoute<RouteName>);
}

/**
 * Unwrap nested state from route params (e.g. React Navigation pass-through state).
 */
export function unwrapRouteState(params: unknown): unknown {
  if (!params || typeof params !== "object") return params;
  const record = params as Record<string, unknown>;
  return "state" in record ? record.state : params;
}
