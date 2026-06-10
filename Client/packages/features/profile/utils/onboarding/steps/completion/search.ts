import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { shouldShowBuyerOnboardingUi } from "packages/features/profile/utils/onboarding/role/onboardingRoleSelection";
import { isBuyerFinancingStepComplete } from "packages/features/profile/utils/onboarding/validation/buyerStepValidation";
import { resolveIdealZipCode } from "packages/utils/product/domain/profile/resolveIdealZipCode";

import { preferenceExtensionSectionHasAny } from "./shared";

export function locationPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const hasAny =
    Array.isArray(formData.important_locations) &&
    formData.important_locations.some((loc) => (loc?.address ?? "").toString().trim().length > 0);
  return { any: hasAny, complete: hasAny };
}

export function financialPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  if (shouldShowBuyerOnboardingUi(formData)) {
    const payingCash = formData.paying_cash === true;
    const hasAny =
      payingCash ||
      !!(formData.lender_status ?? "").trim() ||
      formData.gross_income != null ||
      formData.home_budget_min != null ||
      formData.home_budget_max != null ||
      !!(formData.credit_score_range ?? "").trim() ||
      !!(formData.move_timeline ?? "").trim();
    return { any: hasAny, complete: isBuyerFinancingStepComplete(formData) };
  }

  const idealZip =
    resolveIdealZipCode(formData) ??
    (typeof formData.ideal_zip_code === "string" ? formData.ideal_zip_code.trim() : "");
  const payingCash = formData.paying_cash === true;
  const hasAny =
    payingCash ||
    formData.gross_income != null ||
    formData.down_payment != null ||
    idealZip.length > 0 ||
    formData.credit_score_range != null;
  const complete =
    payingCash ||
    (formData.gross_income != null && formData.down_payment != null && idealZip.length > 0);
  return { any: hasAny, complete };
}

export function searchExtensionPairs(formData: OnboardingData): {
  financing: { any: boolean; complete: boolean };
  locationSchools: { any: boolean; complete: boolean };
  property: { any: boolean; complete: boolean };
  neighborhood: { any: boolean; complete: boolean };
} {
  const extRec = formData.buyerPreferenceExtensions as Record<string, unknown> | undefined;
  const financingAny =
    preferenceExtensionSectionHasAny(extRec?.price_financing) ||
    formData.home_budget_min != null ||
    formData.home_budget_max != null;
  const locationSchoolsAny = preferenceExtensionSectionHasAny(extRec?.location_prefs);
  const propertyAny =
    preferenceExtensionSectionHasAny(extRec?.physical) ||
    preferenceExtensionSectionHasAny(extRec?.condition) ||
    preferenceExtensionSectionHasAny(extRec?.utilities) ||
    (typeof formData.listing_status === "string" && formData.listing_status.trim().length > 0);
  const neighborhoodAny = preferenceExtensionSectionHasAny(extRec?.neighborhood);

  const same = (b: boolean) => ({ any: b, complete: b });
  return {
    financing: same(financingAny),
    locationSchools: same(locationSchoolsAny),
    property: same(propertyAny),
    neighborhood: same(neighborhoodAny),
  };
}
