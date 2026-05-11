/**
 * Form data shape for search filters (criteria). Used by SearchFiltersContent and SearchFiltersSheet.
 * Mirrors the subset of user preferences fields used by search; avoids importing from profile feature.
 */
export type SearchImportantLocation = {
  address: string;
  commute_tolerance?: number;
  name?: string;
};

export type SearchFiltersFormData = {
  important_locations?: SearchImportantLocation[];
  home_budget_min?: number;
  home_budget_max?: number;
  preferred_bedrooms_min?: number;
  preferred_bedrooms_max?: number;
  preferred_bathrooms_min?: number;
  preferred_bathrooms_max?: number;
  preferred_housing_type?: string;
  /** Legacy categorical; cleared when using acre range sliders */
  preferred_lot_size?: string;
  /** Legacy categorical; cleared when using age range sliders */
  preferred_home_age?: string;
  preferred_lot_size_min?: number;
  preferred_lot_size_max?: number;
  preferred_home_age_min?: number;
  preferred_home_age_max?: number;
  preferred_architectural_style?: string;
  renovation_preference?: string;
  intended_property_use?: string;
  walkability_importance?: string;
  /** Housing essentials (basement, garage, AC, …) — enforced server-side on search results. */
  must_have?: string[];
  /** Nice-to-have features for ranking (same matching as profile preferred_home_features). */
  preferred_home_features?: string[];
  [key: string]: unknown;
};
