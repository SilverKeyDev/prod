export type PrefetchDashboardShellRouteOptions = {
  /** When set, avoids prefetching the opposite role's lazy-only chunks (messaging + dashboard). */
  isAgent?: boolean;
};

export type PrefetchDashboardShellRouteFn = (
  href: string,
  options?: PrefetchDashboardShellRouteOptions
) => void;
