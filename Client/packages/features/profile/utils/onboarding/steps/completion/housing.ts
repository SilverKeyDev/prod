import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import { parseHousingTypes } from "packages/features/profile/utils/public/constants";

export function housingEssentialsPair(formData: OnboardingData): {
  any: boolean;
  complete: boolean;
} {
  const housingTypes = parseHousingTypes(formData.preferred_housing_type);
  const hasListingType =
    Array.isArray(formData.listing_type) && formData.listing_type.some((x) => String(x).trim());
  const hasMustHave =
    Array.isArray(formData.must_have) && formData.must_have.some((x) => String(x).trim());
  const hasAny =
    formData.preferred_bedrooms_min != null ||
    formData.preferred_bathrooms_min != null ||
    housingTypes.length > 0 ||
    hasListingType ||
    hasMustHave;
  const complete =
    formData.preferred_bedrooms_min != null &&
    formData.preferred_bathrooms_min != null &&
    housingTypes.length > 0;
  return { any: hasAny, complete };
}

export function housingRangesPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const hasAny =
    formData.preferred_sqft_min != null ||
    formData.preferred_sqft_max != null ||
    formData.preferred_lot_size_min != null ||
    formData.preferred_lot_size_max != null ||
    formData.preferred_home_age_min != null ||
    formData.preferred_home_age_max != null ||
    formData.days_on_market_min != null ||
    formData.days_on_market_max != null;
  return { any: hasAny, complete: hasAny };
}

export function housingDetailsPair(formData: OnboardingData): { any: boolean; complete: boolean } {
  const hasAny =
    (Array.isArray(formData.other_requirements) && formData.other_requirements.length > 0) ||
    (typeof formData.preferred_architectural_style === "string" &&
      formData.preferred_architectural_style.trim().length > 0) ||
    (typeof formData.walkability_importance === "string" &&
      formData.walkability_importance.trim().length > 0) ||
    (typeof formData.intended_property_use === "string" &&
      formData.intended_property_use.trim().length > 0) ||
    (typeof formData.renovation_preference === "string" &&
      formData.renovation_preference.trim().length > 0);
  return { any: hasAny, complete: hasAny };
}
