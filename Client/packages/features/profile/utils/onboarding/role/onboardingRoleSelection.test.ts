import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

import { formDataToPreferencesPayload } from "@/features/profile/utils/onboarding/sync/profileFormSync";

import {
  applyOnboardingRoleSelection,
  isSelectableOnboardingRole,
  primaryOnboardingRoleFromForm,
  WHY_JOIN_FOR_ROLE,
} from "./onboardingRoleSelection";

describe("applyOnboardingRoleSelection", () => {
  it("maps agent to primary_onboarding_role and clears why_joining", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("agent", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("agent");
    expect(patches.why_joining_silverkey).toEqual([]);
  });

  it("maps buyer to primary_onboarding_role and buying_house", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("buyer", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("buyer");
    expect(patches.why_joining_silverkey).toEqual([WHY_JOIN_FOR_ROLE.buyer]);
  });

  it("maps seller to primary_onboarding_role and buyer+seller tags", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("seller", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("seller");
    expect(patches.why_joining_silverkey).toEqual([
      WHY_JOIN_FOR_ROLE.buyer,
      WHY_JOIN_FOR_ROLE.seller,
    ]);
  });

  it("maps brokerage to primary_onboarding_role", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("brokerage", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("brokerage");
    expect(patches.why_joining_silverkey).toEqual([]);
  });

  it("maps integration partner to primary_onboarding_role", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("integration_partner", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("integration_partner");
    expect(patches.why_joining_silverkey).toEqual([]);
  });
});

describe("primaryOnboardingRoleFromForm", () => {
  it("prefers primary_onboarding_role when set", () => {
    expect(
      primaryOnboardingRoleFromForm({
        primary_onboarding_role: "seller",
      })
    ).toBe("seller");
  });

  it("infers agent from auth roles when draft role missing", () => {
    expect(primaryOnboardingRoleFromForm({}, { roles: ["agent"] })).toBe("agent");
  });

  it("infers buyer from why_joining", () => {
    expect(
      primaryOnboardingRoleFromForm({
        why_joining_silverkey: ["buying_house"],
      })
    ).toBe("buyer");
  });

  it("infers seller when buyer and seller intents both exist", () => {
    expect(
      primaryOnboardingRoleFromForm({
        why_joining_silverkey: [WHY_JOIN_FOR_ROLE.buyer, WHY_JOIN_FOR_ROLE.seller],
      })
    ).toBe("seller");
  });
});

describe("formDataToPreferencesPayload", () => {
  it("includes primary_onboarding_role for server role sync", () => {
    const payload = formDataToPreferencesPayload({
      primary_onboarding_role: "buyer",
    } as OnboardingData);
    expect(payload.primary_onboarding_role).toBe("buyer");
  });

  it("strips workspace_shell_test_input from preferences payload", () => {
    const payload = formDataToPreferencesPayload({
      primary_onboarding_role: "seller",
      workspace_shell_test_input: "draft-only",
    } as OnboardingData);
    expect(payload.workspace_shell_test_input).toBeUndefined();
  });
});

describe("isSelectableOnboardingRole", () => {
  it("allows all public onboarding roles", () => {
    expect(isSelectableOnboardingRole("buyer")).toBe(true);
    expect(isSelectableOnboardingRole("agent")).toBe(true);
    expect(isSelectableOnboardingRole("seller")).toBe(true);
    expect(isSelectableOnboardingRole("brokerage")).toBe(true);
    expect(isSelectableOnboardingRole("integration_partner")).toBe(true);
  });
});

describe("legacy investor draft", () => {
  it("maps investor draft to buyer flow", () => {
    expect(
      primaryOnboardingRoleFromForm({
        primary_onboarding_role: "investor",
      })
    ).toBe("buyer");
  });
});
