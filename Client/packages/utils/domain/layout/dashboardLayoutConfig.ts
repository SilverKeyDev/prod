/**
 * Single source for path-based layout config. Used by DashboardLayout, DashboardContent,
 * and DashboardHeader so no per-route booleans are passed as props.
 */

export const PATH_PREFIXES = {
  search: "/search",
  dashboard: "/dashboard",
  profile: "/profile",
  saved: "/saved",
  messaging: "/messaging",
} as const;

export type PathPrefix = keyof typeof PATH_PREFIXES;

/** Content width as % of available viewport (0–100). */
export const PATH_WIDTH_PERCENT: Record<PathPrefix, number> = {
  search: 100,
  dashboard: 90,
  profile: 90,
  saved: 90,
  messaging: 100,
};

export function pathMatches(pathname: string): {
  isSearch: boolean;
  isDashboard: boolean;
  isProfile: boolean;
  isSaved: boolean;
  isMessaging: boolean;
  isFullHeightRoute: boolean;
} {
  const isSearch = pathname.startsWith(PATH_PREFIXES.search);
  const isDashboard = pathname.startsWith(PATH_PREFIXES.dashboard);
  const isProfile = pathname.startsWith(PATH_PREFIXES.profile);
  const isSaved = pathname.startsWith(PATH_PREFIXES.saved);
  const isMessaging = pathname.startsWith(PATH_PREFIXES.messaging);
  const isFullHeightRoute = isSearch || isMessaging;
  return {
    isSearch,
    isDashboard,
    isProfile,
    isSaved,
    isMessaging,
    isFullHeightRoute,
  };
}

export function getWidthPercent(pathname: string, defaultPct: number): number {
  const key = (Object.keys(PATH_PREFIXES) as PathPrefix[]).find((p) =>
    pathname.startsWith(PATH_PREFIXES[p]),
  );
  const pct = key ? PATH_WIDTH_PERCENT[key] : defaultPct;
  return Math.max(0, Math.min(100, pct));
}
