/**
 * Single source for path-based layout config. Used by DashboardLayout, DashboardContent,
 * and DashboardHeader so no per-route booleans are passed as props.
 *
 * Route resolution uses a single deterministic function (getActiveDashboardKey) so layout
 * and content never disagree. UI should prefer useDashboardRoute() (React Router useMatch)
 * when inside the app so the router is the source of truth.
 */

export const PATH_PREFIXES = {
  search: "/search",
  dashboard: "/dashboard",
  analytics: "/analytics",
  profile: "/profile",
  library: "/library",
  messaging: "/messaging",
  find_agents: "/find-agents",
} as const;

export type PathPrefix = keyof typeof PATH_PREFIXES;

/** Ordered keys for deterministic resolution; first match wins. */
const DASHBOARD_ROUTE_ORDER: PathPrefix[] = [
  "search",
  "messaging",
  "find_agents",
  "dashboard",
  "analytics",
  "library",
  "profile",
];

/**
 * Single source of truth: which dashboard area this pathname belongs to.
 * Used by pathMatches, getWidthPercent, and tests. Prefer useDashboardRoute() in UI.
 */

/** Strip `/buyer` or `/brokerage` shell prefix so layout keys match legacy path resolution. */
export function stripWorkspaceShellPrefix(pathname: string): string {
  if (pathname === "/buyer" || pathname.startsWith("/buyer/")) {
    const rest = pathname === "/buyer" ? "/" : pathname.slice("/buyer".length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  if (pathname === "/brokerage" || pathname.startsWith("/brokerage/")) {
    const rest = pathname === "/brokerage" ? "/dashboard" : pathname.slice("/brokerage".length);
    return rest.startsWith("/") ? rest : `/${rest}`;
  }
  return pathname;
}

export function getActiveDashboardKey(pathname: string): PathPrefix | null {
  const normalized = stripWorkspaceShellPrefix(pathname);
  if (normalized === "/saved" || normalized.startsWith("/saved/")) {
    return "library";
  }
  for (const key of DASHBOARD_ROUTE_ORDER) {
    const prefix = PATH_PREFIXES[key];
    if (normalized === prefix || normalized.startsWith(prefix + "/")) {
      return key;
    }
  }
  return null;
}

/** Content width as % of available viewport (0–100). */
export const PATH_WIDTH_PERCENT: Record<PathPrefix, number> = {
  search: 100,
  dashboard: 90,
  analytics: 90,
  profile: 90,
  /** Match dashboard/profile content width; inset comes from SavedPageLayout (see DashboardScreen `px-4`). */
  library: 90,
  messaging: 100,
  find_agents: 90,
};

export function pathMatches(pathname: string): {
  isSearch: boolean;
  isDashboard: boolean;
  isProfile: boolean;
  isLibrary: boolean;
  isMessaging: boolean;
  isFullHeightRoute: boolean;
} {
  const key = getActiveDashboardKey(pathname);
  return {
    isSearch: key === "search",
    isDashboard: key === "dashboard",
    isProfile: key === "profile",
    isLibrary: key === "library",
    isMessaging: key === "messaging",
    isFullHeightRoute: key === "search" || key === "messaging",
  };
}

export function getWidthPercent(pathname: string, defaultPct: number): number {
  const key = getActiveDashboardKey(pathname);
  const pct = key ? PATH_WIDTH_PERCENT[key] : defaultPct;
  return Math.max(0, Math.min(100, pct));
}
