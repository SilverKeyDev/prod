import { CHECKLIST_PREFETCH_ROUTE_KEYS } from "packages/features/checklists/api/checklistQueryKeys";
import { agentRoutes } from "packages/services/data/dataRoutes/agentRoutes";
import { calendarRoutes } from "packages/services/data/dataRoutes/calendarRoutes";
import { checklistRoutes } from "packages/services/data/dataRoutes/checklistRoutes";
import { coreUserRoutes } from "packages/services/data/dataRoutes/coreUserRoutes";
import { documentRoutes } from "packages/services/data/dataRoutes/documentRoutes";
import { messagingRoutes } from "packages/services/data/dataRoutes/messagingRoutes";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";
import type { UserProfile } from "packages/types";

export type { RouteConfig } from "packages/services/data/dataRouteTypes";

/** Buyer-shaped sessions that can resolve GET /transactions/me for checklist prefetch. */
function shouldPrefetchBuyerChecklists(user: UserProfile | null): boolean {
  if (!user) {
    return false;
  }
  const roles = (user.roles ?? []).map((role) => role.toLowerCase());
  const isAgent = roles.includes("agent");
  if (!isAgent) {
    return true;
  }
  return roles.some((role) => role === "buyer" || role === "seller" || role === "investor");
}

/**
 * Centralized configuration for all data routes
 * Defines which routes are loaded initially, which are polled, and at what intervals
 */
export const DATA_ROUTES = {
  ...coreUserRoutes,
  ...agentRoutes,
  ...messagingRoutes,
  ...calendarRoutes,
  ...checklistRoutes,
  ...documentRoutes,
} as const;

/**
 * Get all routes that should be loaded initially
 */
export function getInitialLoadRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = (user?.roles ?? []).includes("agent");
  const authed = Boolean(user);
  return Object.values(DATA_ROUTES).filter((route) => {
    if (!route.initialLoad) {
      return false;
    }
    if (route.key === "agentTodos") {
      return authed;
    }
    if (CHECKLIST_PREFETCH_ROUTE_KEYS.has(route.key)) {
      return shouldPrefetchBuyerChecklists(user);
    }
    return route.userType === "all" || (route.userType === "agent" && isAgent);
  });
}

/**
 * Get all routes that should be polled
 */
export function getPollingRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = (user?.roles ?? []).includes("agent");
  return Object.values(DATA_ROUTES).filter(
    (route) =>
      route.shouldPoll && (route.userType === "all" || (route.userType === "agent" && isAgent))
  );
}
