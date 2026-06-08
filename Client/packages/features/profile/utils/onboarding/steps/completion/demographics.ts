import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import {
  primaryOnboardingRoleFromForm,
  shouldShowBuyerOnboardingUi,
} from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { isBuyerAboutMeStepComplete } from "packages/features/profile/utils/onboarding/validation/buyerStepValidation";

export function demographicsPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  if (shouldShowBuyerOnboardingUi(formData)) {
    const moving = formData.buyer_about_moving_with ?? [];
    const hasAny =
      moving.length > 0 ||
      formData.buyer_about_has_pets != null ||
      !!(formData.buyer_about_move_motivation ?? "").trim();
    return { any: hasAny, complete: isBuyerAboutMeStepComplete(formData) };
  }

  const name = (formData.name ?? "").toString().trim();
  const hasAny =
    name.length > 0 ||
    primaryOnboardingRoleFromForm(formData) != null ||
    formData.age != null ||
    (formData.marital_status ?? "").toString().trim().length > 0;
  const ageOk = formData.age != null && formData.age > 0;
  return { any: hasAny, complete: name.length > 0 && ageOk };
}
