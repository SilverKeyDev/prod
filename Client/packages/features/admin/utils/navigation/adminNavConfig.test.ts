import { describe, expect, it } from "vitest";

import {
  ADMIN_BASE_PATH,
  ADMIN_NAV_SPEC,
  ADMIN_ROUTE_SEGMENTS,
  segmentFromPath,
  visibleAdminNavSpec,
} from "./adminNavConfig";

describe("adminNavConfig", () => {
  it("ADMIN_ROUTE_SEGMENTS uses kebab-case segments", () => {
    expect(ADMIN_ROUTE_SEGMENTS.devPersona).toBe("dev-persona");
    expect(ADMIN_ROUTE_SEGMENTS.superadmin).toBe("superadmin");
  });

  it("segmentFromPath returns null outside /admin", () => {
    expect(segmentFromPath("/dashboard")).toBeNull();
    expect(segmentFromPath("/admin")).toBeNull();
  });

  it("segmentFromPath returns first segment under /admin/", () => {
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/logging`)).toBe("logging");
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/dev-persona/extra`)).toBe("dev-persona");
  });

  it("segmentFromPath returns null for unknown admin child", () => {
    expect(segmentFromPath(`${ADMIN_BASE_PATH}/unknown-tab`)).toBeNull();
  });

  it("visibleAdminNavSpec hides superadmin row when false", () => {
    const without = visibleAdminNavSpec(false);
    expect(without.some((r) => r.key === ADMIN_ROUTE_SEGMENTS.superadmin)).toBe(false);
    const withSuper = visibleAdminNavSpec(true);
    expect(withSuper.some((r) => r.key === ADMIN_ROUTE_SEGMENTS.superadmin)).toBe(true);
  });

  it("ADMIN_NAV_SPEC includes dev persona and unique keys", () => {
    const keys = ADMIN_NAV_SPEC.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(ADMIN_ROUTE_SEGMENTS.devPersona);
  });
});
