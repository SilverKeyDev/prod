import { describe, expect, it } from "vitest";

import { deriveDevAppPersonaFromProfile } from "./deriveDevAppPersonaFromProfile";

describe("deriveDevAppPersonaFromProfile", () => {
  it("returns null when user is missing", () => {
    expect(deriveDevAppPersonaFromProfile(null)).toBeNull();
    expect(deriveDevAppPersonaFromProfile(undefined)).toBeNull();
  });

  it("returns agent for agent role without brokerage or partner signals", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["agent", "admin"],
      })
    ).toBe("agent");
  });

  it("returns brokerage when brokerage_org_ids is non-empty", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["agent"],
        brokerage_org_ids: ["org-1"],
      })
    ).toBe("brokerage");
  });

  it("returns brokerage for brokerage_admin role", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["Brokerage_Admin"],
      })
    ).toBe("brokerage");
  });

  it("returns integration_partner for integration_partner role", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["integration_partner"],
      })
    ).toBe("integration_partner");
  });

  it("returns seller when only seller role in client mode", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["seller"],
      })
    ).toBe("seller");
  });

  it("returns buyer when only buyer role in client mode", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["buyer"],
      })
    ).toBe("buyer");
  });

  it("defaults to buyer when client has both buyer and seller roles", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["buyer", "seller"],
      })
    ).toBe("buyer");
  });

  it("defaults to buyer when client has no buyer/seller roles", () => {
    expect(
      deriveDevAppPersonaFromProfile({
        roles: ["admin"],
      })
    ).toBe("buyer");
  });
});
