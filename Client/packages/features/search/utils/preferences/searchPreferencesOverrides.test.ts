import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile";

import { formDataToSearchFilterOverrides } from "./searchPreferencesOverrides";

describe("formDataToSearchFilterOverrides", () => {
  it("maps top-level numeric and list fields used by polygon search", () => {
    const form: Partial<OnboardingData> = {
      home_budget_min: 300_000,
      home_budget_max: 600_000,
      preferred_bedrooms_min: 2,
      preferred_bedrooms_max: 4,
      preferred_bathrooms_min: 1,
      preferred_bathrooms_max: 3,
      preferred_sqft_min: 1000,
      preferred_sqft_max: 2500,
      preferred_lot_size_min: 0.2,
      preferred_lot_size_max: 2,
      preferred_home_age_min: 0,
      preferred_home_age_max: 20,
      days_on_market_min: 0,
      days_on_market_max: 45,
      preferred_housing_type: "condo",
      listing_status: "active",
      listing_type: ["for_sale"],
      must_have: ["garage"],
      other_requirements: ["no HOA"],
    };

    expect(formDataToSearchFilterOverrides(form)).toEqual({
      home_budget_min: 300_000,
      home_budget_max: 600_000,
      preferred_bedrooms_min: 2,
      preferred_bedrooms_max: 4,
      preferred_bathrooms_min: 1,
      preferred_bathrooms_max: 3,
      preferred_sqft_min: 1000,
      preferred_sqft_max: 2500,
      preferred_lot_size_min: 0.2,
      preferred_lot_size_max: 2,
      preferred_home_age_min: 0,
      preferred_home_age_max: 20,
      days_on_market_min: 0,
      days_on_market_max: 45,
      preferred_housing_type: "condo",
      listing_status: "active",
      listing_type: ["for_sale"],
      must_have: ["garage"],
      other_requirements: ["no HOA"],
    });
  });

  it("returns empty object when form has no searchable overrides", () => {
    expect(formDataToSearchFilterOverrides({})).toEqual({});
  });
});
