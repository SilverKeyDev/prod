import { agentRoutes } from "packages/services/data/dataRoutes/agentRoutes";
import { calendarRoutes } from "packages/services/data/dataRoutes/calendarRoutes";
import { checklistRoutes } from "packages/services/data/dataRoutes/checklistRoutes";
import { coreUserRoutes } from "packages/services/data/dataRoutes/coreUserRoutes";
import { messagingRoutes } from "packages/services/data/dataRoutes/messagingRoutes";
import type { RouteConfig } from "packages/services/data/dataRouteTypes";
import type { UserProfile } from "packages/types";

export type { RouteConfig } from "packages/services/data/dataRouteTypes";

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
} as const;

/**
 * Get all routes that should be loaded initially
 */
export function getInitialLoadRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = user?.is_agent ?? false;
  const authed = Boolean(user);
  return Object.values(DATA_ROUTES).filter((route) => {
    if (!route.initialLoad) {
      return false;
    }
    if (route.key === "agentTodos") {
      return authed;
    }
    return route.userType === "all" || (route.userType === "agent" && isAgent);
  });
}

/**
 * Get all routes that should be polled
 */
export function getPollingRoutes(user: UserProfile | null): RouteConfig[] {
  const isAgent = user?.is_agent ?? false;
  return Object.values(DATA_ROUTES).filter(
    (route) =>
      route.shouldPoll && (route.userType === "all" || (route.userType === "agent" && isAgent))
  );
}
