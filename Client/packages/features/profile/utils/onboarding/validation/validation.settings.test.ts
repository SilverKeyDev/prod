import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";

import { validateSettingsData } from "./validation";

describe("validateSettingsData", () => {
  it("allows save with empty home preference fields", () => {
    const formData: OnboardingData = {
      home_budget_min: undefined,
      home_budget_max: undefined,
      preferred_bedrooms_min: undefined,
      preferred_bathrooms_min: undefined,
      important_locations: [],
    };
    const result = validateSettingsData(formData);
    expect(result.isValid).toBe(true);
    expect(result.missingFields).toEqual([]);
  });

  it("still rejects inconsistent down payment vs budget", () => {
    const formData: OnboardingData = {
      paying_cash: false,
      down_payment: 500_000,
      home_budget_max: 400_000,
    };
    const result = validateSettingsData(formData);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
