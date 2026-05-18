import { describe, expect, it } from "vitest";

import { deriveDevAppPersonaFromProfile } from "./deriveDevAppPersonaFromProfile";

describe("deriveDevAppPersonaFromProfile", () => {
  it("returns null when user is missing", () => {
    expect(deriveDevAppPersonaFromProfile(null)).toBeNull();
    expect(deriveDevAppPersonaFromProfile(undefined)).toBeNull();
  });

  it("returns agent for is_agent without brokerage signals", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: true,
        roles: ["admin"],
      })
    ).toBe("agent");
  });

  it("returns broker when brokerage_org_ids is non-empty", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: true,
        roles: [],
        brokerage_org_ids: ["org-1"],
      })
    ).toBe("broker");
  });

  it("returns broker for brokerage_admin role", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: true,
        roles: ["Brokerage_Admin"],
      })
    ).toBe("broker");
  });

  it("returns seller when only seller role in client mode", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: false,
        roles: ["seller"],
      })
    ).toBe("seller");
  });

  it("returns buyer when only buyer role in client mode", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: false,
        roles: ["buyer"],
      })
    ).toBe("buyer");
  });

  it("defaults to buyer when client has both buyer and seller roles", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: false,
        roles: ["buyer", "seller"],
      })
    ).toBe("buyer");
  });

  it("defaults to buyer when client has no buyer/seller roles", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        is_agent: false,
        roles: ["admin"],
      })
    ).toBe("buyer");
  });
});
