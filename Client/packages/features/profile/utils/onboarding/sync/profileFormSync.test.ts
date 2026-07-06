import { describe, expect, it } from "vitest";

import type { OnboardingData } from "packages/features/profile/types/onboarding/onboarding";
import {
  API_GET_KEYS,
  API_POST_KEYS,
  SEARCH_PREFERENCES_FIELDS,
} from "packages/features/profile/utils/onboarding/steps/fieldContract";

import {
  formDataToPreferencesPayload,
  mergeOnboardingServerAndDraft,
  nextPreferencesVersion,
  userPreferencesToOnboardingData,
} from "./profileFormSync";

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
    it("keeps empty locations when draft explicitly clears them", () => {
      const merged = mergeOnboardingServerAndDraft(
        {
          gross_income: 100000,
          important_locations: [{ address: "1 Main St" }],
        },
        { preferred_bedrooms_min: 3, important_locations: [] }
      );
      expect(merged.gross_income).toBe(100000);
      expect(merged.preferred_bedrooms_min).toBe(3);
      expect(merged.important_locations).toEqual([]);
    });

    it("uses server locations when draft omits important_locations", () => {
      const merged = mergeOnboardingServerAndDraft(
        {
          gross_income: 100000,
          important_locations: [{ address: "1 Main St" }],
        },
        { preferred_bedrooms_min: 3 }
      );
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

    it("maps preferred_bedrooms_min/max to form preferred_bedrooms_min and preferred_bedrooms_max", () => {
      const fixture = {
        [API_GET_KEYS.preferred_bedrooms_min]: 2,
        [API_GET_KEYS.preferred_bedrooms_max]: 4,
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_bedrooms_min).toBe(2);
      expect(result.preferred_bedrooms_max).toBe(4);
    });

    it("does not map legacy preferred_bedrooms when min/max are canonical", () => {
      const fixture = {
        preferred_bedrooms: 3,
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_bedrooms_min).toBeUndefined();
    });

    it("maps preferred_bathrooms_min/max to form preferred_bathrooms_min and preferred_bathrooms_max", () => {
      const fixture = {
        [API_GET_KEYS.preferred_bathrooms_min]: 1,
        [API_GET_KEYS.preferred_bathrooms_max]: 3,
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_bathrooms_min).toBe(1);
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
      const fixture = {
        other_requirements: ["street parking", "no gated communities"],
      };
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
        renovation_preference: "minor",
        intended_property_use: "primary",
      };
      const result = userPreferencesToOnboardingData(fixture);
      expect(result.preferred_architectural_style).toBe("modern");
      expect(result.renovation_preference).toBe("minor");
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

    it("sends preferred_bedrooms_min and preferred_bedrooms_max in payload", () => {
      const formData = { preferred_bedrooms_min: 2, preferred_bedrooms_max: 4 };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload[API_POST_KEYS.preferred_bedrooms_min]).toBe(2);
      expect(payload[API_POST_KEYS.preferred_bedrooms_max]).toBe(4);
    });

    it("sends preferred_bathrooms_min and preferred_bathrooms_max in payload", () => {
      const formData = {
        preferred_bathrooms_min: 1,
        preferred_bathrooms_max: 3,
      };
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

    it("sends empty important_locations array to clear saved locations", () => {
      const formData = { important_locations: [] };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload[API_POST_KEYS.important_locations]).toEqual([]);
    });

    it("sends other_requirements in payload when present", () => {
      const formData = {
        other_requirements: ["street parking", "no gated communities"],
      };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.other_requirements).toEqual(["street parking", "no gated communities"]);
    });

    it("sends preferred_architectural_style, renovation_preference, intended_property_use in payload", () => {
      const formData = {
        preferred_architectural_style: "colonial",
        renovation_preference: "major",
        intended_property_use: "investment",
      };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.preferred_architectural_style).toBe("colonial");
      expect(payload.renovation_preference).toBe("major");
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

    it("roundtrips buyer SIL-182 fields through extended_buyer_preferences", () => {
      const formData = {
        primary_onboarding_role: "buyer" as const,
        buyer_about_moving_with: ["kids"],
        buyer_about_kids_ages: "5, 7",
        buyer_about_has_pets: true,
        buyer_about_pet_types: ["dog"],
        preferred_contact_method: "email",
        communication_frequency: "weekly",
        pets: "yes",
        lender_status: "pre_approved",
        lender_name: "Better",
        paying_cash: false,
        gross_income: 150_000,
        loan_type: "conventional",
        down_payment_band: "10_20",
        first_home: "yes",
        home_budget_min: 400_000,
        home_budget_max: 600_000,
        credit_score_range: "700_749",
        rent_or_own: "rent",
        move_timeline: "3_6_months",
      };
      const payload = formDataToPreferencesPayload(formData);
      expect(payload.extended_buyer_preferences).toBeDefined();
      expect(payload.buyer_about_moving_with).toBeUndefined();
      expect(payload.lender_status).toBeUndefined();
      expect(payload.preferred_contact_method).toBe("email");

      const loaded = userPreferencesToOnboardingData(payload);
      expect(loaded.buyer_about_moving_with).toEqual(["kids"]);
      expect(loaded.lender_status).toBe("pre_approved");
      expect(loaded.lender_name).toBe("Better");
      expect(loaded.preferred_contact_method).toBe("email");
    });
  });

  describe("search preferences top-level roundtrip", () => {
    it("documents every search dropdown field in SEARCH_PREFERENCES_FIELDS", () => {
      expect(SEARCH_PREFERENCES_FIELDS.length).toBeGreaterThan(40);
    });

    const topLevelRoundtrips: Array<{ key: keyof OnboardingData; value: unknown }> = [
      { key: "home_budget_min", value: 350_000 },
      { key: "home_budget_max", value: 750_000 },
      { key: "preferred_bedrooms_min", value: 2 },
      { key: "preferred_bedrooms_max", value: 4 },
      { key: "preferred_bathrooms_min", value: 1 },
      { key: "preferred_bathrooms_max", value: 3 },
      { key: "preferred_housing_type", value: "single_family" },
      { key: "listing_type", value: ["for_sale", "pending"] },
      { key: "must_have", value: ["garage", "pool"] },
      { key: "preferred_sqft_min", value: 1200 },
      { key: "preferred_sqft_max", value: 2800 },
      { key: "days_on_market_min", value: 0 },
      { key: "days_on_market_max", value: 30 },
      { key: "preferred_lot_size_min", value: 0.1 },
      { key: "preferred_lot_size_max", value: 1.5 },
      { key: "preferred_home_age_min", value: 0 },
      { key: "preferred_home_age_max", value: 25 },
      { key: "preferred_architectural_style", value: "modern" },
      { key: "walkability_importance", value: "high" },
      { key: "intended_property_use", value: "primary" },
      { key: "renovation_preference", value: "minor" },
      { key: "listing_status", value: "active" },
      { key: "other_requirements", value: ["street parking"] },
    ];

    it.each(topLevelRoundtrips)("roundtrips $key through save and load", ({ key, value }) => {
      const form = { [key]: value } as OnboardingData;
      const payload = formDataToPreferencesPayload(form);
      const loaded = userPreferencesToOnboardingData(payload);
      expect(loaded[key]).toEqual(value);
    });

    it("roundtrips important_locations with commute_tolerance", () => {
      const form: OnboardingData = {
        important_locations: [{ address: "100 Main St", commute_tolerance: 25 }],
      };
      const loaded = userPreferencesToOnboardingData(formDataToPreferencesPayload(form));
      expect(loaded.important_locations).toEqual([
        { address: "100 Main St", commute_tolerance: 25 },
      ]);
    });

    it("hydrates walkability_importance from neighborhood extension when top-level missing", () => {
      const fixture = {
        extended_buyer_preferences: {
          v: 1,
          neighborhood: { walkability_importance: "moderate" },
        },
      };
      const loaded = userPreferencesToOnboardingData(fixture);
      expect(loaded.walkability_importance).toBe("moderate");
    });
  });

  describe("search preferences extension roundtrip", () => {
    const extensionCases = [
      {
        label: "location_prefs",
        form: {
          buyerPreferenceExtensions: {
            v: 1 as const,
            location_prefs: { flood_importance: "high", noise_importance: "low" },
          },
        },
        assert: (loaded: OnboardingData) => {
          expect(loaded.buyerPreferenceExtensions?.location_prefs?.flood_importance).toBe("high");
          expect(loaded.buyerPreferenceExtensions?.location_prefs?.noise_importance).toBe("low");
        },
      },
      {
        label: "neighborhood",
        form: {
          buyerPreferenceExtensions: {
            v: 1 as const,
            neighborhood: {
              walkability_importance: "high",
              crime_importance: "moderate",
              pet_friendly_area: "low",
            },
          },
        },
        assert: (loaded: OnboardingData) => {
          expect(loaded.buyerPreferenceExtensions?.neighborhood?.crime_importance).toBe("moderate");
          expect(loaded.buyerPreferenceExtensions?.neighborhood?.pet_friendly_area).toBe("low");
        },
      },
      {
        label: "physical",
        form: {
          buyerPreferenceExtensions: {
            v: 1 as const,
            physical: {
              garage_required: true,
              garage_min_cars: 2,
              stories_preference: "two",
              parking_type: "garage",
              accessibility_needs: "step_free",
              outdoor_space_importance: "high",
              fireplace_preference: "yes",
              view_importance: "moderate",
            },
          },
        },
        assert: (loaded: OnboardingData) => {
          expect(loaded.buyerPreferenceExtensions?.physical?.garage_required).toBe(true);
          expect(loaded.buyerPreferenceExtensions?.physical?.garage_min_cars).toBe(2);
        },
      },
      {
        label: "condition",
        form: {
          buyerPreferenceExtensions: {
            v: 1 as const,
            condition: {
              prefer_price_reduced: true,
              prefer_virtual_tour: true,
              prefer_open_house: false,
              foreclosure_ok: true,
            },
          },
        },
        assert: (loaded: OnboardingData) => {
          expect(loaded.buyerPreferenceExtensions?.condition?.prefer_price_reduced).toBe(true);
          expect(loaded.buyerPreferenceExtensions?.condition?.foreclosure_ok).toBe(true);
        },
      },
      {
        label: "utilities",
        form: {
          buyerPreferenceExtensions: {
            v: 1 as const,
            utilities: {
              hvac_preference: "central",
              utilities_included_importance: "low",
              solar_interest: "yes",
              ev_charger_interest: "nice_to_have",
            },
          },
        },
        assert: (loaded: OnboardingData) => {
          expect(loaded.buyerPreferenceExtensions?.utilities?.hvac_preference).toBe("central");
          expect(loaded.buyerPreferenceExtensions?.utilities?.ev_charger_interest).toBe(
            "nice_to_have"
          );
        },
      },
    ] as const;

    it.each(extensionCases)("roundtrips extended $label", ({ form, assert }) => {
      const payload = formDataToPreferencesPayload(form as OnboardingData);
      const loaded = userPreferencesToOnboardingData(payload);
      assert(loaded);
    });

    it("mirrors top-level walkability into neighborhood on save", () => {
      const form: OnboardingData = { walkability_importance: "high" };
      const payload = formDataToPreferencesPayload(form);
      const ext = payload.extended_buyer_preferences as {
        neighborhood?: { walkability_importance?: string };
      };
      expect(ext.neighborhood?.walkability_importance).toBe("high");
    });
  });
});
