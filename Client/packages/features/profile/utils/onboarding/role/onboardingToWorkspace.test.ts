import { describe, expect, it } from "vitest";

import { deriveAllowedWorkspaces } from "packages/utils/product/workspace/deriveAllowedWorkspaces";

import { applyOnboardingRoleSelection } from "./onboardingRoleSelection";
import { postOnboardingWorkspaceForPrimaryRole } from "./onboardingToWorkspace";

describe("postOnboardingWorkspaceForPrimaryRole", () => {
  it("maps each primary onboarding role to its workspace", () => {
    expect(postOnboardingWorkspaceForPrimaryRole("seller")).toBe("seller");
    expect(postOnboardingWorkspaceForPrimaryRole("renter")).toBe("renter");
    expect(postOnboardingWorkspaceForPrimaryRole("brokerage")).toBe("brokerage");
    expect(postOnboardingWorkspaceForPrimaryRole("integration_partner")).toBe(
      "integration_partner"
    );
    expect(postOnboardingWorkspaceForPrimaryRole("buyer")).toBe("buyer");
    expect(postOnboardingWorkspaceForPrimaryRole("agent")).toBe("agent");
  });

  it("defaults unknown role to buyer workspace", () => {
    expect(postOnboardingWorkspaceForPrimaryRole(undefined)).toBe("buyer");
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

  it("seller selection maps to seller workspace", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("seller", (k, v) => {
      patches[k] = v;
    });

    expect(patches.primary_onboarding_role).toBe("seller");
    expect(postOnboardingWorkspaceForPrimaryRole("seller")).toBe("seller");
  });

  it("renter selection maps to renter workspace", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("renter", (k, v) => {
      patches[k] = v;
    });

    expect(patches.primary_onboarding_role).toBe("renter");
    expect(postOnboardingWorkspaceForPrimaryRole("renter")).toBe("renter");
  });
});
