import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { formDataToPreferencesPayload } from "packages/features/profile/utils/onboarding/sync/profileFormSync";

import {
  applyOnboardingRoleSelection,
  isBuyerOnboardingRole,
  isSelectableOnboardingRole,
  primaryOnboardingRoleFromForm,
  shouldShowBuyerOnboardingUi,
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

  it("maps renter to primary_onboarding_role and renting_house tag", () => {
    const patches: Record<string, unknown> = {};
    applyOnboardingRoleSelection("renter", (k, v) => {
      patches[String(k)] = v;
    });
    expect(patches.primary_onboarding_role).toBe("renter");
    expect(patches.why_joining_silverkey).toEqual([WHY_JOIN_FOR_ROLE.renter]);
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

  it("infers renter from renting_house tag", () => {
    expect(
      primaryOnboardingRoleFromForm({
        why_joining_silverkey: [WHY_JOIN_FOR_ROLE.renter],
      })
    ).toBe("renter");
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
    expect(isSelectableOnboardingRole("renter")).toBe(true);
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

describe("isBuyerOnboardingRole", () => {
  it("returns true for buyer primary role", () => {
    expect(isBuyerOnboardingRole({ primary_onboarding_role: "buyer" })).toBe(true);
  });

  it("returns false for agent primary role", () => {
    expect(isBuyerOnboardingRole({ primary_onboarding_role: "agent" })).toBe(false);
  });

  it("returns true for buyer primary even when auth roles include agent", () => {
    expect(isBuyerOnboardingRole({ primary_onboarding_role: "buyer" }, { roles: ["agent"] })).toBe(
      true
    );
  });

  it("infers buyer from legacy why_joining only", () => {
    expect(isBuyerOnboardingRole({ why_joining_silverkey: [WHY_JOIN_FOR_ROLE.buyer] })).toBe(true);
  });
});

describe("shouldShowBuyerOnboardingUi", () => {
  it("shows buyer UI for pure buyer", () => {
    expect(shouldShowBuyerOnboardingUi({ primary_onboarding_role: "buyer" })).toBe(true);
  });

  it("hides buyer UI for agent shell", () => {
    expect(shouldShowBuyerOnboardingUi({ primary_onboarding_role: "agent" })).toBe(false);
  });

  it("hides buyer UI for seller", () => {
    expect(shouldShowBuyerOnboardingUi({ primary_onboarding_role: "seller" })).toBe(false);
  });

  it("hides buyer UI for renter", () => {
    expect(shouldShowBuyerOnboardingUi({ primary_onboarding_role: "renter" })).toBe(false);
  });
});
