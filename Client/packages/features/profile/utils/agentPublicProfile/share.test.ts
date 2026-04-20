import { describe, expect, it } from "vitest";

import { isAgentIdentityForProfileUi, resolveAgentPublicProfileShare } from "./share";

describe("isAgentIdentityForProfileUi", () => {
  it("is true when store is agent", () => {
    expect(isAgentIdentityForProfileUi(true, null)).toBe(true);
  });

  it("is true when profile has agent role", () => {
    expect(isAgentIdentityForProfileUi(false, { roles: ["agent"] })).toBe(true);
  });

  it("is false for client profile", () => {
    expect(
      isAgentIdentityForProfileUi(false, {
        is_agent: false,
        roles: ["client"],
      })
    ).toBe(false);
  });
});

describe("resolveAgentPublicProfileShare", () => {
  it("shows when store says agent and profile id exists", () => {
    expect(
      resolveAgentPublicProfileShare({
        storeIsAgent: true,
        authUser: { id: "a1", name: "A" },
        userProfile: { id: "p1", name: "P", is_agent: false },
      })
    ).toEqual({ show: true, agentId: "p1", displayName: "P" });
  });

  it("shows when profile has is_agent and id, store false", () => {
    expect(
      resolveAgentPublicProfileShare({
        storeIsAgent: false,
        authUser: null,
        userProfile: { id: "u9", is_agent: true, name: "N" },
      })
    ).toEqual({ show: true, agentId: "u9", displayName: "N" });
  });

  it("shows when profile has agent role", () => {
    expect(
      resolveAgentPublicProfileShare({
        storeIsAgent: false,
        authUser: null,
        userProfile: { id: "r1", roles: ["agent"] },
      })
    ).toEqual({ show: true, agentId: "r1", displayName: undefined });
  });

  it("falls back to auth user id when profile not loaded yet but store is agent", () => {
    expect(
      resolveAgentPublicProfileShare({
        storeIsAgent: true,
        authUser: { id: "auth-1", name: "Auth Name" },
        userProfile: null,
      })
    ).toEqual({ show: true, agentId: "auth-1", displayName: "Auth Name" });
  });

  it("hides when not agent", () => {
    expect(
      resolveAgentPublicProfileShare({
        storeIsAgent: false,
        authUser: { id: "x" },
        userProfile: { id: "x", is_agent: false },
      })
    ).toEqual({ show: false, agentId: "x", displayName: undefined });
  });

  it("hides when agent but no id", () => {
    expect(
      resolveAgentPublicProfileShare({
        storeIsAgent: true,
        authUser: { id: "" },
        userProfile: null,
      })
    ).toEqual({ show: false, agentId: "", displayName: undefined });
  });
});
