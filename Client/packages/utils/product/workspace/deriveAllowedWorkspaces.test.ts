import { describe, expect, it } from "vitest";

import { deriveAllowedWorkspaces } from "./deriveAllowedWorkspaces";

describe("deriveAllowedWorkspaces", () => {
  it("defaults non-agent without roles to buyer only", () => {
    expect(deriveAllowedWorkspaces({})).toEqual(["buyer"]);
  });

  it("defaults agent without other roles to agent only", () => {
    expect(deriveAllowedWorkspaces({ roles: ["agent"] })).toEqual(["agent"]);
  });

  it("includes seller when user_roles has seller", () => {
    expect(deriveAllowedWorkspaces({ roles: ["seller"] })).toEqual(["seller"]);
  });

  it("includes buyer and seller for dual client roles", () => {
    const list = deriveAllowedWorkspaces({ roles: ["buyer", "seller"] });
    expect(list).toContain("buyer");
    expect(list).toContain("seller");
  });

  it("includes brokerage from org ids", () => {
    expect(
      deriveAllowedWorkspaces({
        roles: ["buyer"],
        brokerageOrgIds: ["org-1"],
      })
    ).toContain("brokerage");
  });

  it("includes brokerage from brokerage_admin role", () => {
    expect(
      deriveAllowedWorkspaces({
        roles: ["agent", "brokerage_admin"],
      })
    ).toContain("brokerage");
  });

  it("includes integration_partner from integration_partner role without buyer fallback", () => {
    expect(
      deriveAllowedWorkspaces({
        roles: ["integration_partner"],
      })
    ).toEqual(["integration_partner"]);
  });

  it("brokerage_admin-only persona allows brokerage without buyer fallback", () => {
    expect(
      deriveAllowedWorkspaces({
        roles: ["brokerage_admin"],
      })
    ).toEqual(["brokerage"]);
  });

  it("agent with buyer role gets buyer and agent workspaces", () => {
    const list = deriveAllowedWorkspaces({ roles: ["agent", "buyer"] });
    expect(list).toContain("agent");
    expect(list).toContain("buyer");
  });
});
