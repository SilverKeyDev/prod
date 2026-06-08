import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

import { getProfileSectionCompletion } from "./profileSectionCompletion";

describe("getProfileSectionCompletion buyer paths", () => {
  it("marks demographics complete when buyer About Me validators pass", () => {
    const formData: OnboardingData = {
      primary_onboarding_role: "buyer",
      buyer_about_moving_with: ["partner"],
      buyer_about_has_pets: false,
    };
    expect(getProfileSectionCompletion(formData).demographics).toBe("complete");
  });

  it("marks demographics needs_attention when buyer fields started but incomplete", () => {
    const formData: OnboardingData = {
      primary_onboarding_role: "buyer",
      buyer_about_moving_with: ["partner"],
      buyer_about_has_pets: undefined,
    };
    expect(getProfileSectionCompletion(formData).demographics).toBe("needs_attention");
  });

  it("marks financial complete when buyer financing validators pass", () => {
    const formData: OnboardingData = {
      primary_onboarding_role: "buyer",
      lender_status: "not_yet",
      want_lender_connection: false,
      paying_cash: true,
      move_timeline: "asap",
    };
    expect(getProfileSectionCompletion(formData).financial).toBe("complete");
  });

  it("marks financial needs_attention when lender name missing for pre-approved", () => {
    const formData: OnboardingData = {
      primary_onboarding_role: "buyer",
      lender_status: "pre_approved",
      lender_name: "",
      paying_cash: true,
      move_timeline: "asap",
    };
    expect(getProfileSectionCompletion(formData).financial).toBe("needs_attention");
  });
});
