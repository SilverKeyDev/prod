import { describe, expect, it } from "vitest";

import type { UserProfile } from "@/features/homeauth/types";

import { mergeSessionRefreshUserIntoAuthProfile } from "./mergeAuthUserProfile";

const baseProfile: UserProfile = {
  id: "u1",
  email: "dev@usesilverkey.com",
  name: "Dev Admin",
  created_at: "2026-01-01T00:00:00Z",
  is_active: true,
  has_preferences: true,
  roles: ["seller", "admin"],
  brokerage_org_ids: ["org-1"],
};

describe("mergeSessionRefreshUserIntoAuthProfile", () => {
  it("updates session fields from refresh patch", () => {
    const merged = mergeSessionRefreshUserIntoAuthProfile(baseProfile, {
      email: "dev@usesilverkey.com",
      name: "Renamed",
      roles: ["agent"],
      auth_method: "google",
    });

    expect(merged.name).toBe("Renamed");
    expect(merged.roles).toEqual(["agent"]);
    expect(merged.auth_method).toBe("google");
  });

  it("preserves roles and brokerage_org_ids omitted from refresh payload", () => {
    const merged = mergeSessionRefreshUserIntoAuthProfile(baseProfile, {
      id: "u1",
      email: "dev@usesilverkey.com",
      name: "Dev Admin",
      roles: ["seller"],
    });

    expect(merged.roles).toEqual(["seller"]);
    expect(merged.brokerage_org_ids).toEqual(["org-1"]);
    expect(merged.has_preferences).toBe(true);
  });
});
