import { describe, expect, it } from "vitest";

import {
  ADMIN_BASE_PATH,
  ADMIN_NAV_SPEC,
  ADMIN_ROUTE_SEGMENTS,
  segmentFromPath,
  superadminOnlyRouteSegments,
  visibleAdminNavSpec,
} from "./adminNavConfig";

describe("adminNavConfig", () => {
  it("ADMIN_ROUTE_SEGMENTS uses kebab-case segments", () => {
    expect(ADMIN_ROUTE_SEGMENTS.logging).toBe("logging");
    expect(ADMIN_ROUTE_SEGMENTS.integrations).toBe("integrations");
    expect(ADMIN_ROUTE_SEGMENTS.partners).toBe("partners");
    expect(ADMIN_ROUTE_SEGMENTS.devPersona).toBe("dev-persona");
    expect(ADMIN_ROUTE_SEGMENTS.superadmin).toBe("superadmin");
    expect(ADMIN_ROUTE_SEGMENTS.wiki).toBe("wiki");
  });

  it("superadminOnlyRouteSegments includes partners, support messaging, and superadmin", () => {
    expect(superadminOnlyRouteSegments()).toEqual(
      expect.arrayContaining([
        ADMIN_ROUTE_SEGMENTS.partners,
        ADMIN_ROUTE_SEGMENTS.supportMessaging,
        ADMIN_ROUTE_SEGMENTS.superadmin,
      ])
    );
  });

  it("segmentFromPath returns null outside /admin", () => {
    expect(segmentFromPath("/dashboard")).toBeNull();
    expect(segmentFromPath("/admin")).toBeNull();
  });

  it("segmentFromPath returns first segment under /admin/", () => {
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/logging`)).toBe("logging");
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/dev-persona/extra`)).toBe("dev-persona");
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/wiki/client/architecture/foo`)).toBe("wiki");
  });

  it("segmentFromPath returns null for unknown admin child", () => {
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/unknown-tab`)).toBeNull();
  });

  it("visibleAdminNavSpec hides superadmin-only rows when false", () => {
    const without = visibleAdminNavSpec(false);
    for (const key of superadminOnlyRouteSegments()) {
      expect(without.some((r) => r.key === key)).toBe(false);
    }
    const withSuper = visibleAdminNavSpec(true);
    for (const key of superadminOnlyRouteSegments()) {
      expect(withSuper.some((r) => r.key === key)).toBe(true);
    }
  });

  it("ADMIN_NAV_SPEC includes logging, wiki, integrations, dev persona, and unique keys", () => {
    const keys = ADMIN_NAV_SPEC.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(ADMIN_ROUTE_SEGMENTS.logging);
    expect(keys).toContain(ADMIN_ROUTE_SEGMENTS.wiki);
    expect(keys).toContain(ADMIN_ROUTE_SEGMENTS.integrations);
    expect(keys).not.toContain("operations");
    expect(keys).toContain(ADMIN_ROUTE_SEGMENTS.devPersona);
    expect(keys).not.toContain("notifications");
    expect(keys).not.toContain("platform-health");
  });
});
