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
  important_locations: "important_locations",
} as const;

/** Payload keys backend expects on POST (write_preferences_from_payload). */
export const API_POST_KEYS = {
  housing_type: "housing_type",
  preferred_bedrooms_min: "preferred_bedrooms_min",
  preferred_bedrooms_max: "preferred_bedrooms_max",
  preferred_bathrooms_min: "preferred_bathrooms_min",
  preferred_bathrooms_max: "preferred_bathrooms_max",
  important_locations: "important_locations",
} as const;

/** Form keys (OnboardingData) used in UI. */
export const FORM_KEYS = {
  preferred_housing_type: "preferred_housing_type",
  preferred_bedrooms: "preferred_bedrooms",
  preferred_bedrooms_max: "preferred_bedrooms_max",
  preferred_bathrooms: "preferred_bathrooms",
  preferred_bathrooms_max: "preferred_bathrooms_max",
  important_locations: "important_locations",
} as const;
