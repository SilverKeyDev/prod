import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding";
import {
  applyOnboardingRoleSelection,
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
});

describe("formDataToPreferencesPayload", () => {
  it("omits draft-only primary_onboarding_role", () => {
    const payload = formDataToPreferencesPayload({
      is_agent: "no",
      primary_onboarding_role: "investor",
    } as OnboardingData);
    expect(Object.prototype.hasOwnProperty.call(payload, "primary_onboarding_role")).toBe(false);
  });
});
