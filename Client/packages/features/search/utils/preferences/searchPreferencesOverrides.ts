import type { OnboardingData } from "packages/features/profile";
import type { SearchFilterOverrides } from "packages/features/search/store/searchContext.slice";

/** Map persisted form state to session-only polygon search overrides. */
export function formDataToSearchFilterOverrides(
  formData: Partial<OnboardingData>
): Partial<SearchFilterOverrides> {
  const out: Partial<SearchFilterOverrides> = {};

  const numericKeys = [
    "home_budget_min",
    "home_budget_max",
    "preferred_bedrooms_min",
    "preferred_bedrooms_max",
    "preferred_bathrooms_min",
    "preferred_bathrooms_max",
    "preferred_sqft_min",
    "preferred_sqft_max",
    "preferred_lot_size_min",
    "preferred_lot_size_max",
    "preferred_home_age_min",
    "preferred_home_age_max",
    "days_on_market_min",
    "days_on_market_max",
  ] as const satisfies readonly (keyof SearchFilterOverrides)[];

  for (const key of numericKeys) {
    const v = formData[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    }
  }

  const housingType = formData.preferred_housing_type;
  if (typeof housingType === "string" && housingType.trim()) {
    out.preferred_housing_type = housingType.trim();
  }

  const listingStatus = formData.listing_status;
  if (typeof listingStatus === "string" && listingStatus.trim()) {
    out.listing_status = listingStatus.trim();
  }

  const listKeys = [
    "listing_type",
    "must_have",
    "preferred_home_features",
    "other_requirements",
  ] as const;
  for (const key of listKeys) {
    const v = formData[key];
    if (Array.isArray(v)) {
      out[key] = v.map(String);
    }
  }

  return out;
}
