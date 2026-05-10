import type { IconName } from "packages/ui/types/icons";

/** URL segment under `/admin/` (kebab-case). */
export const ADMIN_ROUTE_SEGMENTS = {
  platformHealth: "platform-health",
  analytics: "analytics",
  notifications: "notifications",
  logging: "logging",
  partners: "partners",
  superadmin: "superadmin",
} as const;

export type AdminRouteSegment =
  (typeof ADMIN_ROUTE_SEGMENTS)[keyof typeof ADMIN_ROUTE_SEGMENTS];

export const ADMIN_BASE_PATH = "/admin";

export type AdminNavSpecItem = {
  key: AdminRouteSegment;
  label: string;
  iconName: IconName;
  superadminOnly?: boolean;
};

/** Static nav metadata (icons resolved in the web shell). */
export const ADMIN_NAV_SPEC: readonly AdminNavSpecItem[] = [
  {
    key: ADMIN_ROUTE_SEGMENTS.platformHealth,
    label: "Platform health",
    iconName: "activity",
  },
  {
    key: ADMIN_ROUTE_SEGMENTS.analytics,
    label: "Analytics",
    iconName: "bar-chart-2",
  },
  {
    key: ADMIN_ROUTE_SEGMENTS.notifications,
    label: "Notifications",
    iconName: "inbox",
  },
  {
    key: ADMIN_ROUTE_SEGMENTS.logging,
    label: "Logging",
    iconName: "file-text",
  },
  {
    key: ADMIN_ROUTE_SEGMENTS.partners,
    label: "Partners",
    iconName: "handshake",
  },
  {
    key: ADMIN_ROUTE_SEGMENTS.superadmin,
    label: "Superadmin",
    iconName: "shield",
    superadminOnly: true,
  },
] as const;

export function segmentFromPath(pathname: string): AdminRouteSegment | null {
  const prefix = `${ADMIN_BASE_PATH}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const seg = pathname.slice(prefix.length).split("/")[0];
  const allowed = Object.values(ADMIN_ROUTE_SEGMENTS) as string[];
  return allowed.includes(seg) ? (seg as AdminRouteSegment) : null;
}

export function visibleAdminNavSpec(includeSuperadmin: boolean): readonly AdminNavSpecItem[] {
  if (includeSuperadmin) {
    return [...ADMIN_NAV_SPEC];
  }
  return ADMIN_NAV_SPEC.filter((row) => !row.superadminOnly);
}
