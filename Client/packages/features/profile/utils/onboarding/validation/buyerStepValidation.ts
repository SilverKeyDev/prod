import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import type { ValidationResult } from "packages/features/profile/types/onboarding/onboarding";
import { parseKidsAgesString } from "packages/features/profile/utils/onboarding/buyerKidsAges";
import { shouldShowBuyerOnboardingUi } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";

function invalid(result: Partial<ValidationResult>): ValidationResult {
  return {
    isValid: false,
    missingFields: result.missingFields ?? [],
    errors: result.errors ?? [],
  };
}

function valid(): ValidationResult {
  return { isValid: true, missingFields: [], errors: [] };
}

/** Buyer About Me onboarding step required fields (SIL-182). */
export function validateBuyerAboutMeStep(formData: OnboardingData): ValidationResult {
  const missing: string[] = [];

  const moving = formData.buyer_about_moving_with ?? [];
  if (moving.length === 0) {
    missing.push("Who's moving with you");
  }
  if (moving.includes("kids")) {
    if (parseKidsAgesString(formData.buyer_about_kids_ages).length === 0) {
      missing.push("Kids ages");
    }
  }
  if (formData.buyer_about_has_pets === undefined) {
    missing.push("Pets");
  }
  if (formData.buyer_about_has_pets === true) {
    const types = formData.buyer_about_pet_types ?? [];
    if (types.length === 0) missing.push("Pet types");
  }

  return missing.length === 0 ? valid() : invalid({ missingFields: missing });
}

/** Buyer Financing onboarding step required fields (SIL-182). */
export function validateBuyerFinancingStep(formData: OnboardingData): ValidationResult {
  const missing: string[] = [];

  if (!(formData.lender_status ?? "").trim()) {
    missing.push("Lender status");
  }
  const status = formData.lender_status;
  if (status === "pre_approved" || status === "pre_qualified") {
    if (!(formData.lender_name ?? "").trim()) missing.push("Lender name");
  }
  if (status === "not_yet" && formData.want_lender_connection === undefined) {
    missing.push("Lender connection preference");
  }

  if (formData.paying_cash === undefined) {
    missing.push("Payment method");
  }

  if (!formData.paying_cash) {
    if (!formData.gross_income || formData.gross_income <= 0) missing.push("Gross income");
    if (!(formData.loan_type ?? "").trim()) missing.push("Loan type");
    if (!(formData.down_payment_band ?? "").trim()) missing.push("Down payment band");
    if (!(formData.first_home ?? "").trim()) missing.push("First home");
    if (!formData.home_budget_min || formData.home_budget_min <= 0) {
      missing.push("Price range minimum");
    }
    if (!formData.home_budget_max || formData.home_budget_max <= 0) {
      missing.push("Price range maximum");
    }
    if (!(formData.credit_score_range ?? "").trim()) missing.push("Credit score");
    if (!(formData.rent_or_own ?? "").trim()) missing.push("Rent or own");
    if (formData.rent_or_own === "own" && !(formData.need_to_sell_first ?? "").trim()) {
      missing.push("Need to sell first");
    }
  }

  if (!(formData.move_timeline ?? "").trim()) {
    missing.push("Move timeline");
  }

  return missing.length === 0 ? valid() : invalid({ missingFields: missing });
}

export function isBuyerAboutMeStepComplete(formData: OnboardingData): boolean {
  return validateBuyerAboutMeStep(formData).isValid;
}

export function isBuyerFinancingStepComplete(formData: OnboardingData): boolean {
  return validateBuyerFinancingStep(formData).isValid;
}

/** Use buyer step validators when primary role is buyer (not agent shell). */
export function shouldUseBuyerOnboardingValidators(formData: OnboardingData): boolean {
  return shouldShowBuyerOnboardingUi(formData);
}
