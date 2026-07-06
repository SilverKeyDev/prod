/**
 * Field contract: form keys, API keys (GET response), and payload keys (POST) for profile/preferences.
 * Used for audit tests and to keep client–backend mapping in sync.
 * Backend: _build_preferences_dict (read), write_preferences_from_payload (write).
 */

/** API keys returned by backend GET /api/v1/preferences (_build_preferences_dict). */
export const API_GET_KEYS = {
  housing_type: "housing_type",
  preferred_bedrooms_min: "preferred_bedrooms_min",
  preferred_bedrooms_max: "preferred_bedrooms_max",
  preferred_bathrooms_min: "preferred_bathrooms_min",
  preferred_bathrooms_max: "preferred_bathrooms_max",
  /** Mirrored from housing_type when client expects preferred_housing_type. */
  preferred_housing_type: "preferred_housing_type",
  important_locations: "important_locations",
  listing_status: "listing_status",
  extended_buyer_preferences: "extended_buyer_preferences",
  walkability_importance: "walkability_importance",
} as const;

/** Payload keys backend expects on POST (write_preferences_from_payload). */
export const API_POST_KEYS = {
  housing_type: "housing_type",
  preferred_bedrooms_min: "preferred_bedrooms_min",
  preferred_bedrooms_max: "preferred_bedrooms_max",
  preferred_bathrooms_min: "preferred_bathrooms_min",
  preferred_bathrooms_max: "preferred_bathrooms_max",
  important_locations: "important_locations",
  listing_status: "listing_status",
  extended_buyer_preferences: "extended_buyer_preferences",
} as const;

/** Form keys (OnboardingData) used in UI. */
export const FORM_KEYS = {
  preferred_housing_type: "preferred_housing_type",
  preferred_bedrooms_min: "preferred_bedrooms_min",
  preferred_bedrooms_max: "preferred_bedrooms_max",
  preferred_bathrooms_min: "preferred_bathrooms_min",
  preferred_bathrooms_max: "preferred_bathrooms_max",
  important_locations: "important_locations",
} as const;

export type SearchPreferencePersistence = "top-level" | "extended" | "search-display";

export type SearchPreferenceUpdateVia = "updateFormData" | "patchBuyerPreferenceExtensions";

/** Registry of every control in the Search preferences dropdown (SearchPreferencesContent). */
export type SearchPreferenceFieldDef = {
  /** Dot path for nested extension fields (e.g. physical.garage_required). */
  formPath: string;
  /** Top-level OnboardingData key when applicable. */
  formKey?: keyof import("packages/features/profile/types/onboarding/onboarding").OnboardingData;
  apiKey?: string;
  persistence: SearchPreferencePersistence;
  updateVia: SearchPreferenceUpdateVia;
  extendedSection?: string;
};

export const SEARCH_PREFERENCES_FIELDS: SearchPreferenceFieldDef[] = [
  // Price
  {
    formPath: "home_budget_min",
    formKey: "home_budget_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "home_budget_max",
    formKey: "home_budget_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  // Housing essentials
  {
    formPath: "preferred_bedrooms_min",
    formKey: "preferred_bedrooms_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_bedrooms_max",
    formKey: "preferred_bedrooms_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_bathrooms_min",
    formKey: "preferred_bathrooms_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_bathrooms_max",
    formKey: "preferred_bathrooms_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_housing_type",
    formKey: "preferred_housing_type",
    apiKey: "housing_type",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "listing_type",
    formKey: "listing_type",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "must_have",
    formKey: "must_have",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  // Housing ranges
  {
    formPath: "preferred_sqft_min",
    formKey: "preferred_sqft_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_sqft_max",
    formKey: "preferred_sqft_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "days_on_market_min",
    formKey: "days_on_market_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "days_on_market_max",
    formKey: "days_on_market_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_lot_size_min",
    formKey: "preferred_lot_size_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_lot_size_max",
    formKey: "preferred_lot_size_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_home_age_min",
    formKey: "preferred_home_age_min",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "preferred_home_age_max",
    formKey: "preferred_home_age_max",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  // Location
  {
    formPath: "important_locations",
    formKey: "important_locations",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "location_prefs.flood_importance",
    extendedSection: "location_prefs",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "location_prefs.noise_importance",
    extendedSection: "location_prefs",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "neighborhood.walkability_importance",
    extendedSection: "neighborhood",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "neighborhood.crime_importance",
    extendedSection: "neighborhood",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "neighborhood.pet_friendly_area",
    extendedSection: "neighborhood",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  // Property search — style & use
  {
    formPath: "preferred_architectural_style",
    formKey: "preferred_architectural_style",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "walkability_importance",
    formKey: "walkability_importance",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "intended_property_use",
    formKey: "intended_property_use",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "renovation_preference",
    formKey: "renovation_preference",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  // Physical
  {
    formPath: "physical.garage_required",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.garage_min_cars",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.stories_preference",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.parking_type",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.accessibility_needs",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.outdoor_space_importance",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.fireplace_preference",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "physical.view_importance",
    extendedSection: "physical",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  // Condition
  {
    formPath: "listing_status",
    formKey: "listing_status",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  {
    formPath: "condition.prefer_price_reduced",
    extendedSection: "condition",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "condition.prefer_virtual_tour",
    extendedSection: "condition",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "condition.prefer_open_house",
    extendedSection: "condition",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "condition.foreclosure_ok",
    extendedSection: "condition",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  // Utilities
  {
    formPath: "utilities.hvac_preference",
    extendedSection: "utilities",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "utilities.utilities_included_importance",
    extendedSection: "utilities",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "utilities.solar_interest",
    extendedSection: "utilities",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  {
    formPath: "utilities.ev_charger_interest",
    extendedSection: "utilities",
    persistence: "extended",
    updateVia: "patchBuyerPreferenceExtensions",
  },
  // Other
  {
    formPath: "other_requirements",
    formKey: "other_requirements",
    persistence: "top-level",
    updateVia: "updateFormData",
  },
  // Search display (not /preferences)
  {
    formPath: "preferences_strict_filter",
    persistence: "search-display",
    updateVia: "updateFormData",
  },
  { formPath: "show_commute_overlay", persistence: "search-display", updateVia: "updateFormData" },
  { formPath: "results_order_by", persistence: "search-display", updateVia: "updateFormData" },
  {
    formPath: "results_sort_direction",
    persistence: "search-display",
    updateVia: "updateFormData",
  },
];
