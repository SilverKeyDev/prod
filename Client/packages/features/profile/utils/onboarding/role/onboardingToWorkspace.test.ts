import { describe, expect, it } from "vitest";

import { deriveAllowedWorkspaces } from "packages/utils/workspace/deriveAllowedWorkspaces";

import { applyOnboardingRoleSelection } from "./onboardingRoleSelection";

describe("onboarding role to workspace derivation", () => {
  it("buyer selection yields buyer workspace when roles are synced", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("buyer", (k, v) => {
      patches[k] = v;
    });

    const roles: string[] = [];
    const why = patches.why_joining_silverkey as string[];
    if (why?.includes("buying_house")) roles.push("buyer");

    const allowed = deriveAllowedWorkspaces({ isAgent: false, roles });
    expect(allowed).toContain("buyer");
  });

  it("agent selection yields agent workspace when roles are synced", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("agent", (k, v) => {
      patches[k] = v;
    });

    const allowed = deriveAllowedWorkspaces({ isAgent: true, roles: [] });
    expect(allowed).toContain("agent");
  });
});
