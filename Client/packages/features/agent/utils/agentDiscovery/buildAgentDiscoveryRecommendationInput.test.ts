import { describe, expect, it } from "vitest";

import {
  buildAgentDiscoveryRecommendationInput,
  serializeAgentDiscoveryRecommendationInput,
} from "./buildAgentDiscoveryRecommendationInput";

describe("buildAgentDiscoveryRecommendationInput", () => {
  it("pulls zip from location label over preferences", () => {
    const input = buildAgentDiscoveryRecommendationInput({
      preferences: {
        financial_profile: { ideal_zip_code: "30309" },
      } as never,
      locationPlaceLabel: "Austin, TX 78701",
      searchFilterOverrides: {},
    });
    expect(input.zip).toBe("78701");
  });

  it("builds intent from housing and overrides", () => {
    const input = buildAgentDiscoveryRecommendationInput({
      preferences: {
        housing_preferences: { preferred_housing_type: "Condo", preferred_bedrooms_min: 2 },
        real_estate: { listing_status: "FOR_SALE" },
      } as never,
      locationPlaceLabel: null,
      searchFilterOverrides: { must_have: ["garage"] },
    });
    expect(input.intent).toContain("Condo");
    expect(input.intent).toContain("2+ bed");
    expect(input.intent).toContain("FOR_SALE");
    expect(input.intent).toContain("garage");
  });

  it("serializes context deterministically", () => {
    expect(serializeAgentDiscoveryRecommendationInput({ zip: "90210", state: "CA" })).toBe(
      serializeAgentDiscoveryRecommendationInput({ zip: "90210", state: "CA" })
    );
  });
});
