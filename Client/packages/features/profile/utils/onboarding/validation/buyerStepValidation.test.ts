import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

import {
  isBuyerAboutMeStepComplete,
  isBuyerFinancingStepComplete,
  validateBuyerAboutMeStep,
  validateBuyerFinancingStep,
} from "./buyerStepValidation";

function completeAboutMe(overrides: Partial<OnboardingData> = {}): OnboardingData {
  return {
    buyer_about_moving_with: ["just_me"],
    buyer_about_has_pets: false,
    ...overrides,
  };
}

function completeFinancing(overrides: Partial<OnboardingData> = {}): OnboardingData {
  return {
    lender_status: "not_yet",
    want_lender_connection: false,
    paying_cash: false,
    gross_income: 120_000,
    loan_type: "conventional",
    down_payment_band: "10_20",
    first_home: "yes",
    home_budget_min: 300_000,
    home_budget_max: 500_000,
    credit_score_range: "700_749",
    rent_or_own: "rent",
    move_timeline: "asap",
    ...overrides,
  };
}

describe("validateBuyerAboutMeStep", () => {
  it("requires kids ages when kids selected", () => {
    const result = validateBuyerAboutMeStep(
      completeAboutMe({ buyer_about_moving_with: ["kids"], buyer_about_kids_ages: "" })
    );
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("Kids ages");
  });

  it("requires pet types when has pets", () => {
    const result = validateBuyerAboutMeStep(
      completeAboutMe({ buyer_about_has_pets: true, buyer_about_pet_types: [] })
    );
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("Pet types");
  });

  it("passes when all required fields present", () => {
    expect(isBuyerAboutMeStepComplete(completeAboutMe())).toBe(true);
  });
});

describe("validateBuyerFinancingStep", () => {
  it("requires lender name for pre-approved status", () => {
    const result = validateBuyerFinancingStep(
      completeFinancing({ lender_status: "pre_approved", lender_name: "" })
    );
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("Lender name");
  });

  it("requires want_lender_connection when not_yet", () => {
    const result = validateBuyerFinancingStep(
      completeFinancing({ want_lender_connection: undefined })
    );
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("Lender connection preference");
  });

  it("requires need_to_sell_first when rent_or_own is own", () => {
    const result = validateBuyerFinancingStep(
      completeFinancing({ rent_or_own: "own", need_to_sell_first: "" })
    );
    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("Need to sell first");
  });

  it("skips financing fields when paying cash", () => {
    expect(
      isBuyerFinancingStepComplete(
        completeFinancing({
          paying_cash: true,
          gross_income: undefined,
          loan_type: undefined,
          down_payment_band: undefined,
          first_home: undefined,
          home_budget_min: undefined,
          home_budget_max: undefined,
          credit_score_range: undefined,
          rent_or_own: undefined,
        })
      )
    ).toBe(true);
  });
});
