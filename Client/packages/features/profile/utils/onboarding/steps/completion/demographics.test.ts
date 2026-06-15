import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

import { demographicsPair } from "./demographics";

describe("demographicsPair", () => {
  it("returns complete for valid buyer About Me data", () => {
    const formData: OnboardingData = {
      primary_onboarding_role: "buyer",
      buyer_about_moving_with: ["partner"],
      buyer_about_has_pets: false,
    };
    expect(demographicsPair(formData)).toEqual({ any: true, complete: true });
  });

  it("returns needs_attention state when buyer fields started but incomplete", () => {
    const formData: OnboardingData = {
      primary_onboarding_role: "buyer",
      buyer_about_moving_with: ["partner"],
    };
    expect(demographicsPair(formData)).toEqual({ any: true, complete: false });
  });
});
