import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding";

import {
  applyOnboardingRoleSelection,
  isSelectableOnboardingRole,
  primaryOnboardingRoleFromForm,
  WHY_JOIN_FOR_ROLE,
} from "./onboardingRoleSelection";
import { formDataToPreferencesPayload } from "./profileFormSync";

describe("applyOnboardingRoleSelection", () => {
  it("maps agent to is_agent yes and clears why_joining", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("agent", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("agent");
    expect(patches.is_agent).toBe("yes");
    expect(patches.why_joining_silverkey).toEqual([]);
  });

  it("maps buyer to is_agent no and buying_house", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("buyer", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("buyer");
    expect(patches.is_agent).toBe("no");
    expect(patches.why_joining_silverkey).toEqual([WHY_JOIN_FOR_ROLE.buyer]);
  });

  it("does not apply patches for coming-soon seller tile", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("seller", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches).toEqual({});
  });

  it("does not apply patches for coming-soon integration partner tile", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("integration_partner", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches).toEqual({});
  });
});

describe("primaryOnboardingRoleFromForm", () => {
  it("prefers primary_onboarding_role when set", () => {
    expect(
      primaryOnboardingRoleFromForm({
        primary_onboarding_role: "seller",
        is_agent: "no",
      })
    ).toBe("seller");
  });

  it("infers agent from is_agent yes", () => {
    expect(primaryOnboardingRoleFromForm({ is_agent: "yes" })).toBe("agent");
  });

  it("infers buyer from why_joining", () => {
    expect(
      primaryOnboardingRoleFromForm({
        is_agent: "no",
        why_joining_silverkey: ["buying_house"],
      })
    ).toBe("buyer");
  });

  it("infers seller when buyer and seller intents both exist", () => {
    expect(
      primaryOnboardingRoleFromForm({
        is_agent: "no",
        why_joining_silverkey: [WHY_JOIN_FOR_ROLE.buyer, WHY_JOIN_FOR_ROLE.seller],
      })
    ).toBe("seller");
  });
});

describe("formDataToPreferencesPayload", () => {
  it("omits draft-only primary_onboarding_role", () => {
    const payload = formDataToPreferencesPayload({
      is_agent: "no",
      primary_onboarding_role: "buyer",
    } as OnboardingData);
    expect(Object.prototype.hasOwnProperty.call(payload, "primary_onboarding_role")).toBe(false);
  });
});

describe("isSelectableOnboardingRole", () => {
  it("allows buyer and agent only", () => {
    expect(isSelectableOnboardingRole("buyer")).toBe(true);
    expect(isSelectableOnboardingRole("agent")).toBe(true);
    expect(isSelectableOnboardingRole("seller")).toBe(false);
    expect(isSelectableOnboardingRole("integration_partner")).toBe(false);
  });
});

describe("legacy investor draft", () => {
  it("maps investor draft to buyer flow", () => {
    expect(
      primaryOnboardingRoleFromForm({
        primary_onboarding_role: "investor",
        is_agent: "no",
      })
    ).toBe("buyer");
  });
});
