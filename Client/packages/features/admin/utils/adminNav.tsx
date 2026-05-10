import type { ComponentType } from "react";

import { Icon } from "@ui/icons";

import type { NavItem } from "packages/navigation";
import type { IconName } from "packages/ui/types/icons";

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

const ADMIN_BASE = "/admin";

function navIcon(name: IconName): ComponentType<{ size?: number; className?: string }> {
  return (props) => <Icon name={name} {...props} />;
}

export function adminNavItems(includeSuperadmin: boolean): NavItem[] {
  const items: NavItem[] = [
    {
      key: ADMIN_ROUTE_SEGMENTS.platformHealth,
      to: `${ADMIN_BASE}/${ADMIN_ROUTE_SEGMENTS.platformHealth}`,
      label: "Platform health",
      icon: navIcon("activity"),
    },
    {
      key: ADMIN_ROUTE_SEGMENTS.analytics,
      to: `${ADMIN_BASE}/${ADMIN_ROUTE_SEGMENTS.analytics}`,
      label: "Analytics",
      icon: navIcon("bar-chart-2"),
    },
    {
      key: ADMIN_ROUTE_SEGMENTS.notifications,
      to: `${ADMIN_BASE}/${ADMIN_ROUTE_SEGMENTS.notifications}`,
      label: "Notifications",
      icon: navIcon("inbox"),
    },
    {
      key: ADMIN_ROUTE_SEGMENTS.logging,
      to: `${ADMIN_BASE}/${ADMIN_ROUTE_SEGMENTS.logging}`,
      label: "Logging",
      icon: navIcon("file-text"),
    },
    {
      key: ADMIN_ROUTE_SEGMENTS.partners,
      to: `${ADMIN_BASE}/${ADMIN_ROUTE_SEGMENTS.partners}`,
      label: "Partners",
      icon: navIcon("handshake"),
    },
  ];
  if (includeSuperadmin) {
    items.push({
      key: ADMIN_ROUTE_SEGMENTS.superadmin,
      to: `${ADMIN_BASE}/${ADMIN_ROUTE_SEGMENTS.superadmin}`,
      label: "Superadmin",
      icon: navIcon("shield"),
    });
  }
  return items;
}

export function segmentFromPath(pathname: string): AdminRouteSegment | null {
  const prefix = `${ADMIN_BASE}/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }
  const seg = pathname.slice(prefix.length).split("/")[0];
  const allowed = Object.values(ADMIN_ROUTE_SEGMENTS) as string[];
  return allowed.includes(seg) ? (seg as AdminRouteSegment) : null;
}
