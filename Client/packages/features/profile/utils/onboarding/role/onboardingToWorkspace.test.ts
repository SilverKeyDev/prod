import { describe, expect, it } from "vitest";

import { deriveAllowedWorkspaces } from "packages/utils/product/workspace/deriveAllowedWorkspaces";

import { applyOnboardingRoleSelection } from "./onboardingRoleSelection";
import {
  isPlaceholderShellOnboardingRole,
  postOnboardingTargetForPrimaryRole,
} from "./onboardingToWorkspace";

describe("postOnboardingTargetForPrimaryRole", () => {
  it("routes placeholder shell roles to dashboard workspace", () => {
    expect(postOnboardingTargetForPrimaryRole("seller")).toEqual({
      workspace: "seller",
      path: "/dashboard",
    });
    expect(postOnboardingTargetForPrimaryRole("brokerage")).toEqual({
      workspace: "brokerage",
      path: "/dashboard",
    });
    expect(postOnboardingTargetForPrimaryRole("integration_partner")).toEqual({
      workspace: "integration_partner",
      path: "/dashboard",
    });
  });

  it("routes buyer and agent to search", () => {
    expect(postOnboardingTargetForPrimaryRole("buyer")).toEqual({
      workspace: "buyer",
      path: "/search",
    });
    expect(postOnboardingTargetForPrimaryRole("agent")).toEqual({
      workspace: "agent",
      path: "/search",
    });
  });

  it("defaults unknown role to buyer search", () => {
    expect(postOnboardingTargetForPrimaryRole(undefined)).toEqual({
      workspace: "buyer",
      path: "/search",
    });
  });
});

describe("isPlaceholderShellOnboardingRole", () => {
  it("identifies shell workspace roles", () => {
    expect(isPlaceholderShellOnboardingRole("seller")).toBe(true);
    expect(isPlaceholderShellOnboardingRole("brokerage")).toBe(true);
    expect(isPlaceholderShellOnboardingRole("integration_partner")).toBe(true);
    expect(isPlaceholderShellOnboardingRole("buyer")).toBe(false);
    expect(isPlaceholderShellOnboardingRole("agent")).toBe(false);
  });
});

describe("onboarding role to workspace derivation", () => {
  it("buyer selection yields buyer workspace when roles are synced", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("buyer", (k, v) => {
      patches[k] = v;
    });

    const roles: string[] = [];
    const why = patches.why_joining_silverkey as string[];
    if (why?.includes("buying_house")) roles.push("buyer");

    const allowed = deriveAllowedWorkspaces({ roles });
    expect(allowed).toContain("buyer");
  });

  it("agent selection yields agent workspace when roles are synced", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("agent", (k, v) => {
      patches[k] = v;
    });

    expect(patches.primary_onboarding_role).toBe("agent");

    const allowed = deriveAllowedWorkspaces({ roles: ["agent"] });
    expect(allowed).toContain("agent");
  });

  it("seller selection maps to seller dashboard target", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("seller", (k, v) => {
      patches[k] = v;
    });

    expect(patches.primary_onboarding_role).toBe("seller");
    expect(postOnboardingTargetForPrimaryRole("seller").workspace).toBe("seller");
  });
});
