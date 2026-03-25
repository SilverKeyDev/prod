import { describe, expect, it } from "vitest";

import {
  API_GET_KEYS,
  API_POST_KEYS,
  formDataToPreferencesPayload,
  mergeOnboardingServerAndDraft,
  nextPreferencesVersion,
  userPreferencesToOnboardingData,
} from "packages/features/profile";

describe("profileFormSync", () => {
  describe("nextPreferencesVersion", () => {
    it("bumps minor from default when missing", () => {
      expect(nextPreferencesVersion(undefined)).toBe("1.1");
    });

    it("bumps minor from explicit current", () => {
      expect(nextPreferencesVersion("2.4")).toBe("2.5");
    });

    it("handles invalid numeric parts", () => {
      expect(nextPreferencesVersion("x.y")).toBe("1.1");
    });
  });

  describe("mergeOnboardingServerAndDraft", () => {
    it("uses server locations when draft has none", () => {
      const merged = mergeOnboardingServerAndDraft(
        { gross_income: 100000, important_locations: [{ address: "1 Main St" }] },
        { preferred_bedrooms: 3, important_locations: [] }
      );
      expect(merged.gross_income).toBe(100000);
      expect(merged.preferred_bedrooms).toBe(3);
      expect(merged.important_locations).toEqual([{ address: "1 Main St" }]);
    });

    it("prefers draft locations when non-empty", () => {
      const merged = mergeOnboardingServerAndDraft(
        { important_locations: [{ address: "Server St" }] },
        { important_locations: [{ address: "Draft Ave" }] }
      );
      expect(merged.important_locations).toEqual([{ address: "Draft Ave" }]);
    });
  });

  describe("userPreferencesToOnboardingData (load)", () => {
    it("maps backend housing_type to form preferred_housing_type", () => {
      const fixture = { [API_GET_KEYS.housing_type]: "house" };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_housing_type).toBe("house");
    });

    it("maps preferred_bedrooms_min/max to form preferred_bedrooms and preferred_bedrooms_max", () => {
      const fixture = {
        [API_GET_KEYS.preferred_bedrooms_min]: 2,
        [API_GET_KEYS.preferred_bedrooms_max]: 4,
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_bedrooms).toBe(2);
      expect(result.preferred_bedrooms_max).toBe(4);
    });

    it("maps preferred_bathrooms_min/max to form preferred_bathrooms and preferred_bathrooms_max", () => {
      const fixture = {
        [API_GET_KEYS.preferred_bathrooms_min]: 1,
        [API_GET_KEYS.preferred_bathrooms_max]: 3,
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_bathrooms).toBe(1);
      expect(result.preferred_bathrooms_max).toBe(3);
    });

    it("maps important_locations max_commute_minutes to commute_tolerance", () => {
      const fixture = {
        [API_GET_KEYS.important_locations]: [
          {
            address: "123 Main St",
            max_commute_minutes: 30,
            label: "Work",
            commute_mode: "driving",
          },
        ],
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.important_locations).toHaveLength(1);
      expect(result.important_locations?.[0].address).toBe("123 Main St");
      expect(result.important_locations?.[0].commute_tolerance).toBe(30);
    });

    it("maps other_requirements from API when present", () => {
      const fixture = { other_requirements: ["street parking", "no gated communities"] };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.other_requirements).toEqual(["street parking", "no gated communities"]);
    });

    it("merges preferred_home_features and deal_breakers into other_requirements when other_requirements not in API", () => {
      const fixture = {
        preferred_home_features: ["garage", "pool"],
        deal_breakers: ["no HOA"],
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.other_requirements).toEqual(["garage", "pool", "no HOA"]);
    });

    it("maps preferred_architectural_style, renovation_preference, intended_property_use from API", () => {
      const fixture = {
        preferred_architectural_style: "modern",
        renovation_preference: "cosmetic",
        intended_property_use: "primary",
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_architectural_style).toBe("modern");
      expect(result.renovation_preference).toBe("cosmetic");
      expect(result.intended_property_use).toBe("primary");
    });

    it("uses name from userProfile (auth/sign-up source) when provided", () => {
      const prefs = { name: "From Preferences" };
      const userProfile = { name: "Jane Doe" };
      const result = userPreferencesToOnboardingData(prefs, userProfile);
      expect(result.name).toBe("Jane Doe");
    });

    it("falls back to preferences name when userProfile has no name", () => {
      const prefs = { name: "From Preferences" };
      const result = userPreferencesToOnboardingData(prefs, { name: "" });
      expect(result.name).toBe("From Preferences");
    });

    it("falls back to preferences name when userProfile is not passed", () => {
      const prefs = { name: "From Preferences" };
      const result = userPreferencesToOnboardingData(prefs);
      expect(result.name).toBe("From Preferences");
    });
  });

  describe("formDataToPreferencesPayload (save)", () => {
    it("sends preferred_housing_type as housing_type in payload", () => {
      const formData = { preferred_housing_type: "townhome" };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload[API_POST_KEYS.housing_type]).toBe("townhome");
    });

    it("sends preferred_bedrooms and preferred_bedrooms_max as preferred_bedrooms_min/max", () => {
      const formData = { preferred_bedrooms: 2, preferred_bedrooms_max: 4 };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload[API_POST_KEYS.preferred_bedrooms_min]).toBe(2);
      expect(payload[API_POST_KEYS.preferred_bedrooms_max]).toBe(4);
    });

    it("sends preferred_bathrooms and preferred_bathrooms_max as preferred_bathrooms_min/max", () => {
      const formData = { preferred_bathrooms: 1, preferred_bathrooms_max: 3 };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload[API_POST_KEYS.preferred_bathrooms_min]).toBe(1);
      expect(payload[API_POST_KEYS.preferred_bathrooms_max]).toBe(3);
    });

    it("sends important_locations with max_commute_minutes from commute_tolerance", () => {
      const formData = {
        important_locations: [{ address: "456 Oak Ave", commute_tolerance: 20 }],
      };
      const payload = formDataToPreferencesPayload(formData);
      expect(Array.isArray(payload[API_POST_KEYS.important_locations])).toBe(true);
      const locs = payload[API_POST_KEYS.important_locations] as Array<Record<string, unknown>>;
      expect(locs[0].address).toBe("456 Oak Ave");
      expect(locs[0].max_commute_minutes).toBe(20);
    });

    it("sends other_requirements in payload when present", () => {
      const formData = { other_requirements: ["street parking", "no gated communities"] };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.other_requirements).toEqual(["street parking", "no gated communities"]);
    });

    it("sends preferred_architectural_style, renovation_preference, intended_property_use in payload", () => {
      const formData = {
        preferred_architectural_style: "colonial",
        renovation_preference: "moderate",
        intended_property_use: "investment",
      };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.preferred_architectural_style).toBe("colonial");
      expect(payload.renovation_preference).toBe("moderate");
      expect(payload.intended_property_use).toBe("investment");
    });

    it("sends name in payload when present so backend can persist to User", () => {
      const formData = { name: "Jane Doe" };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.name).toBe("Jane Doe");
    });

    it("omits name from payload when empty so backend keeps existing User.name", () => {
      const formData = { name: "" };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.name).toBeUndefined();
    });
  });
});
